import { useEffect, useCallback, useState } from 'react';
import { Input, Button, Col, Card, List, Typography, Avatar, Grid, Spin, Modal, message, Row } from 'antd';

import ContentLayout from '@components/ContentLayout';
import ProfileCard from '@components/ProfileCard';
import KeyModal from '@components/KeyModal';
import useContract from '@hooks/useContract';
import useUser from '@hooks/useUser';
import useCustomState from '@hooks/useCustomState';
import { pinata } from '@services/pinata';
import { encryptSecretKey, generateSecretKey, decryptDataWithSecretKey, encryptDataWithSecretKey, signMessage } from '@utils/encryptionUtils';
import { generateFileSHA256 } from '@utils/fileUtils';

const { Title } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

const Doctors = () => {
  const contract = useContract();
  const user = useUser();
  const screens = useBreakpoint();
  const [state, updateState] = useCustomState({
    doctors: [],
    filteredDoctors: [],
    doctorsWithAccess: [],
    isModalVisible: false,
    selectedDoctor: null,
    isLoading: true,
  });
  const [loadingStates, setLoadingStates] = useState({});

  const fetchAllDoctors = useCallback(async () => {
    updateState({ isLoading: true });
    try {
      const doctors = await contract.getAllDoctors();
      const doctorInfos = await Promise.all(
        doctors.map(async (doctor) => {
          const doctorPublicKey = await contract.getPublicKey(doctor[0]);
          return {
            address: doctor[0],
            name: doctor[1],
            age: Number(doctor[2]),
            gender: doctor[3],
            email: doctor[4],
            contactNumber: doctor[5],
            currentWorkingHospital: doctor[6],
            specialization: doctor[7],
            photoUrl: pinata.getIPFSUrl(doctor[8]),
            publicKey: doctorPublicKey,
          };
        })
      );
      const doctorsWithAccess = await contract.listDoctorsWithAccess();
      updateState({
        doctors: doctorInfos,
        filteredDoctors: doctorInfos,
        doctorsWithAccess: doctorsWithAccess.map((address) =>
          doctorInfos.find((doctor) => doctor.address === address)
        ),
        isLoading: false,
      });
    } catch (error) {
      console.error(error);
      message.error('Error fetching doctors');
      updateState({ isLoading: false });
    }
  }, [contract]);

  const handleSearch = (value) => {
    const filtered = state.doctors.filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(value.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(value.toLowerCase()) ||
        doctor.currentWorkingHospital.toLowerCase().includes(value.toLowerCase())
    );
    updateState({ filteredDoctors: filtered });
  };

  const handleGrantAccess = async (doctor) => {
    setLoadingStates((prev) => ({ ...prev, [doctor.address]: true }));
    try {
      const patientSecretKey = await contract.getSecretKey();
      const encryptedSecretKey = encryptSecretKey(patientSecretKey, doctor.publicKey);
      const tx = await contract.grantAccessToDoctor(doctor.address, encryptedSecretKey);
      await tx.wait();
      updateState({ doctorsWithAccess: [...state.doctorsWithAccess, doctor] });
      message.success('Access granted for ' + doctor.name);
    } catch (error) {
      console.error(error);
      message.error('Error granting access to doctor ' + doctor.name);
    }
    setLoadingStates((prev) => ({ ...prev, [doctor.address]: false }));
  };

  const handleRevokeAccess = async (doctor) => {
    setLoadingStates((prev) => ({ ...prev, [doctor.address]: true }));
    try {
      message.loading('Revoking access from ' + doctor.name);
      const privateKey = await contract.getPrivateKey();
      const oldSecretKey = await contract.getSecretKey();
      const newSecretKey = generateSecretKey();
      const medicalRecords = await contract.getMedicalRecords(user.address);
      const recordsInfo = await Promise.all(
        medicalRecords.map(async (record) => ({
          title: record[0],
          type: record[2],
          sha256: record[4],
          cid: record[9],
          sig: record[10],
        }))
      );
      const updatedRecordsSha256s = [];
      const updatedRecordsCids = [];
      const updatedRecordsSigs = [];
      const remainingDoctors = state.doctorsWithAccess.filter((d) => d.address !== doctor.address).map((d) => d.address);
      const encryptedKeysForRemainingDoctors = await Promise.all(
        remainingDoctors.map((address) => {
          const doctor = state.doctors.find((d) => d.address === address);
          return encryptSecretKey(newSecretKey, doctor.publicKey);
        })
      )
      for (const record of recordsInfo) {
        const fileUrl = await pinata.getIPFSUrl(record.cid);
        const response = await fetch(fileUrl);
        const encryptedData = await response.text();
        const decryptedData = await decryptDataWithSecretKey(oldSecretKey, encryptedData);
        const binaryArray = Uint8Array.from(decryptedData, char => char.charCodeAt(0));
        const blob = new Blob([binaryArray], { type: record.type });
        const file = new File([blob], record.title, { type: record.type });
        await pinata.unpin([record.cid]);
        const sha256 = await generateFileSHA256(file);
        const fileBuffer = await file.arrayBuffer();
        const signature = await signMessage(privateKey, sha256);
        const encryptedFile = await encryptDataWithSecretKey(newSecretKey, fileBuffer);
        const hash = await pinata.uploadToIPFS(encryptedFile);
        updatedRecordsSha256s.push(sha256);
        updatedRecordsCids.push(hash);
        updatedRecordsSigs.push(signature);
      }
      const tx = await contract.revokeAccessFromDoctor(
        doctor.address,
        newSecretKey,
        remainingDoctors,
        encryptedKeysForRemainingDoctors,
        updatedRecordsSha256s,
        updatedRecordsSigs,
        updatedRecordsCids
      );
      await tx.wait();
      updateState({
        doctorsWithAccess: state.doctorsWithAccess.filter((d) => d.address !== doctor.address),
      });
      message.success('Access revoked for ' + doctor.name);
    } catch (error) {
      console.error(error);
      message.error('Error revoking access from doctor ' + doctor.name);
    }
    setLoadingStates((prev) => ({ ...prev, [doctor.address]: false }));
  };

  const isDoctorGrantedAccess = (doctorAddress) =>
    state.doctorsWithAccess.some((d) => d.address === doctorAddress);

  const showDoctorDetails = (doctor) => {
    updateState({ selectedDoctor: doctor, isModalVisible: true });
  };

  const handleCancelModal = () => {
    updateState({ isModalVisible: false, selectedDoctor: null });
  };

  useEffect(() => {
    fetchAllDoctors();
  }, [contract, fetchAllDoctors]);

  return (
    <ContentLayout>
      <Col span={24}>
        {state.isLoading ? (
          <Spin size='large' fullscreen={true} />
        ) : (
          <>
            {state.doctorsWithAccess.length > 0 && (
              <Card bordered style={{ marginBottom: 30 }}>
                <Title level={4} style={{ marginBottom: 20 }}>
                  Supplier with Access
                </Title>
                <List
                  itemLayout={screens.xs ? 'vertical' : 'horizontal'}
                  dataSource={state.doctorsWithAccess}
                  renderItem={(doctor) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar src={doctor.photoUrl} size={60} />}
                        title={
                          <span style={{ fontSize: screens.xs ? '14px' : '15px', fontWeight: 'bold' }}>
                            {doctor.name}
                          </span>
                        }
                        description={
                          <span style={{ fontSize: screens.xs ? '12px' : '13px' }}>
                            {doctor.specialization} at {doctor.currentWorkingHospital}
                          </span>
                        }
                      />
                      <Row justify='center' gutter={16} style={{ marginTop: screens.xs ? 15 : 0 }}>
                        <Col>
                          <Button
                            key='details'
                            size={screens.xs ? 'small' : 'middle'}
                            onClick={() => showDoctorDetails(doctor)}
                          >
                            View Details
                          </Button>
                        </Col>
                        <Col>
                          <Button
                            danger
                            key='revoke'
                            size={screens.xs ? 'small' : 'middle'}
                            onClick={() => handleRevokeAccess(doctor)}
                            loading={loadingStates[doctor.address]}
                          >
                            Revoke Access
                          </Button>
                        </Col>
                      </Row>  
                    </List.Item>
                  )}
                />
              </Card>
            )}
            <Card bordered>
              <Title level={4} style={{ marginBottom: 20 }}>
                Search Suppliers and Grant Access
              </Title>
              <Search
                placeholder='Search doctors by name, specialization, or hospital'
                enterButton='Search'
                size={screens.xs ? 'middle' : 'large'}
                onSearch={handleSearch}
                style={{ marginBottom: 10 }}
              />
              <List
                itemLayout={screens.xs ? 'vertical' : 'horizontal'}
                dataSource={state.filteredDoctors}
                renderItem={(doctor) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar src={doctor.photoUrl} size={60} />}
                      title={
                        <span style={{ fontSize: screens.xs ? '14px' : '15px', fontWeight: 'bold' }}>
                          {doctor.name}
                        </span>
                      }
                      description={
                        <span style={{ fontSize: screens.xs ? '12px' : '13px' }}>
                          {doctor.specialization} at {doctor.currentWorkingHospital}
                        </span>
                      }
                    />
                    <Row justify='center' gutter={16} style={{ marginTop: screens.xs ? 15 : 0 }}>
                      <Col>
                        <Button
                          key='details'
                          size={screens.xs ? 'small' : 'middle'}
                          onClick={() => showDoctorDetails(doctor)}
                        >
                          View Details
                        </Button>
                      </Col>
                      <Col>
                        {isDoctorGrantedAccess(doctor.address) ? (
                          <Button
                            key='granted'
                            type='default'
                            disabled
                            size={screens.xs ? 'small' : 'middle'}
                          >
                            Access Granted
                          </Button>
                        ) : (
                          <Button
                            key='grant'
                            type='primary'
                            size={screens.xs ? 'small' : 'middle'}
                            onClick={() => handleGrantAccess(doctor)}
                            loading={loadingStates[doctor.address]}
                          >
                            Grant Access
                          </Button>
                        )}
                      </Col>
                    </Row>
                  </List.Item>
                )}
              />
            </Card>
          </>
        )}
      </Col>
      <Modal
        title={`${state.selectedDoctor?.name}'s Details`}
        open={state.isModalVisible}
        onCancel={handleCancelModal}
        footer={[
          <Button key='close' onClick={handleCancelModal}>
            Close
          </Button>,
        ]}
        width={screens.xxl || screens.xl ? '60%' : '90%'}
      >
        {state.selectedDoctor && (
          <ProfileCard
            title={state.selectedDoctor.name}
            items={[
              { key: 1, label: 'Name', children: state.selectedDoctor.name },
              { key: 2, label: 'Age', children: state.selectedDoctor.age },
              { key: 3, label: 'Gender', children: state.selectedDoctor.gender},
              { key: 4, label: 'Email', children: state.selectedDoctor.email },
              { key: 5, label: 'Contact Number', children: state.selectedDoctor.contactNumber },
              { key: 6, label: 'Company Name', children: state.selectedDoctor.currentWorkingHospital },
              { key: 7, label: 'Domain', children: state.selectedDoctor.specialization },
              {
                key: 8,
                label: 'Public Key',
                children: (
                  <KeyModal
                    publicKey={state.selectedDoctor.publicKey}
                  />
                )
              }
            ]}
            avatarUrl={state.selectedDoctor.photoUrl}
          />
        )}
      </Modal>
    </ContentLayout>
  );  
};

export default Doctors;
