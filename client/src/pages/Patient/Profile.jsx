import { useCallback, useEffect } from 'react';
import { Col, Button, Form, Input, Modal, message, Spin } from 'antd';

import ContentLayout from '@components/ContentLayout';
import AvatarUpload from '@components/AvatarUpload';
import ProfileCard from '@components/ProfileCard';
import KeyModal from '@components/KeyModal';
import useContract from '@hooks/useContract';
import useUser from '@hooks/useUser';
import useCustomState from '@hooks/useCustomState';
import { pinata } from '@services/pinata';

const Profile = () => {
  const user = useUser();
  const contract = useContract();
  const [form] = Form.useForm();
  const [state, updateState] = useCustomState({
    isModalVisible: false,
    patientData: null,
    items: [],
    fileList: [],
    isSubmitting: false,
    isLoading: true,
  });

  const fetchPatientData = useCallback(async () => {
    updateState({ isLoading: true });
    try {
      const data = await contract.getPatientInfo(user.address);
      const patientPublicKey = await contract.getPublicKey(user.address);
      const patientPrivateKey = await contract.getPrivateKey();
      const patientData = {
        address: data[0],
        name: data[1],
        age: Number(data[2]),
        gender: data[3],
        email: data[4],
        contactNumber: data[5],
        healthIssues: data[6],
        bloodGroup: data[7],
        aadhaarNumber: data[8],
        hash: data[9],
        publicKey: patientPublicKey,
        privateKey: patientPrivateKey,
      };
      const avatarUrl = patientData.hash ? await pinata.getIPFSUrl(patientData.hash) : 'https://example.com/default-avatar.png';
      patientData.avatarUrl = avatarUrl;
      updateState({
        patientData: patientData,
        items: [
          { key: 1, label: 'Address', children: patientData.address },
          { key: 2, label: 'Name', children: patientData.name },
          { key: 3, label: 'Age', children: patientData.age },
          { key: 4, label: 'Gender', children: patientData.gender },
          { key: 5, label: 'Email', children: patientData.email },
          { key: 6, label: 'Contact Number', children: patientData.contactNumber },
          { key: 7, label: 'Product issue', children: patientData.healthIssues },
          { key: 8, label: 'Comapany', children: patientData.bloodGroup },
          { key: 9, label: 'Aadhaar Number', children: patientData.aadhaarNumber },
          {
            key: 10,
            label: 'Public amd Private Keys',
            children: (
              <KeyModal
                publicKey={patientData.publicKey}
                privateKey={patientData.privateKey}
              />
            )
          }
        ],
        isLoading: false,
      });
    } catch (error) {
      console.log(error);
      message.error('Error fetching patient data');
      updateState({ isLoading: false });
    }
  }, [contract]);

  const showModal = () => {
    updateState({ isModalVisible: true });
    form.setFieldsValue({
      age: state.patientData.age,
      email: state.patientData.email,
      contactNumber: state.patientData.contactNumber,
      healthIssues: state.patientData.healthIssues,
      bloodGroup: state.patientData.bloodGroup,
    });
  };

  const handleCancel = () => {
    updateState({ isModalVisible: false });
  };

  const onFormFinish = async (values) => {
    updateState({ isSubmitting: true });
    const { age, email, contactNumber, currentWorkingHospital, specialization } = values;
    let hash = state.patientData.hash;
    if (state.fileList.length > 0) {
      try {
        hash = await pinata.uploadToIPFS(state.fileList[0].originFileObj);
      } catch (error) {
        message.error('Error uploading to IPFS');
        updateState({ isSubmitting: false });
        return;
      }
    }
    try {
      const tx = await contract.updatePatientInfo(
        user.address,
        age,
        email,
        contactNumber,
        currentWorkingHospital,
        specialization,
        hash
      );
      await tx.wait();
      await fetchPatientData();
      updateState({ isModalVisible: false, fileList: [], isSubmitting: false });
      message.success('Patient info updated successfully');
    } catch (error) {
      console.error(error);
      message.error('Error updating patient info');
      updateState({ isSubmitting: false });
    }
  };

  const onFormFinishFailed = (errorInfo) => {
    message.error('Failed to update patient info');
    console.log('Failed:', errorInfo);
  };

  useEffect(() => {
    fetchPatientData();
  }, [contract, fetchPatientData]);

  return (
    <ContentLayout>
      <Col span={24}>
        {state.isLoading ? (
            <Spin size='large' fullscreen={true} />
          ) : (
            <ProfileCard
              title='Patient Profile'
              items={state.items}
              avatarUrl={state.patientData.avatarUrl}
              onEdit={showModal}
            />
          )}
        </Col>
      <Modal
        title='Edit Profile'
        open={state.isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          name='basic'
          layout='vertical'
          onFinish={onFormFinish}
          onFinishFailed={onFormFinishFailed}
          autoComplete='off'
        >
          <Form.Item
            label='Profile Picture'
            name='avatar'
            style={{ textAlign: 'center' }}
          >
            <AvatarUpload state={state} updateState={updateState} />
          </Form.Item>
          <Form.Item
            label='Age'
            name='age'
            rules={[{ required: true, message: 'Please input your age!' }]}
          >
            <Input placeholder='Enter your age' />            
          </Form.Item>
          <Form.Item
            label='Email'
            name='email'
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input placeholder='Enter your email' />
          </Form.Item>
          <Form.Item
            label='Contact Number'
            name='contactNumber'
            rules={[
              { required: true, message: 'Please input your contact number!' },
              { pattern: /^\d{10}$/, message: 'Please enter a valid 10-digit contact number.' },
            ]}
          >
            <Input placeholder='Enter your contact number' />
          </Form.Item>
          <Form.Item
            label='Health Issues'
            name='healthIssues'
          >
            <Input placeholder='Enter your health issues' />
          </Form.Item>
          <Form.Item
            label='Blood Group'
            name='bloodGroup'
            rules={[{ required: true, message: 'Please input your blood group!' }]}
          >
            <Input placeholder='Enter your blood group' />
          </Form.Item>
          <Form.Item>
            <Button
              type='primary'
              htmlType='submit'
              loading={state.isSubmitting}
            >
              Save
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </ContentLayout>
  );
};

export default Profile;
