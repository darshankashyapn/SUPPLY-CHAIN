import { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { List, Button, Col, Row, Card, Grid, Typography, Modal, Spin, Input, message } from 'antd';
import { FilePdfOutlined, FileTextOutlined, EyeOutlined, FileImageOutlined, FileWordOutlined, FileExcelOutlined, FilePptOutlined, FileUnknownOutlined } from '@ant-design/icons';

import FileUpload from '@components/FileUpload';
import useContract from '@hooks/useContract';
import useUser from '@hooks/useUser';
import useCustomState from '@hooks/useCustomState';
import { pinata } from '@services/pinata';
import { getFileCategory } from '@utils/fileType';
import { generateFileSHA256, verifyFileSHA256 } from '@utils/fileUtils';
import { decryptSecretKey, encryptDataWithSecretKey, decryptDataWithSecretKey, signMessage, verifySignedMessage } from '@utils/encryptionUtils';
import apiClient from '@services/api';

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

const RecordList = ({ patientAddress }) => {
  const contract = useContract();
  const user = useUser()
  const [state, updateState] = useCustomState({
    records: [],
    filteredRecords: [],
    fileList: [],
    selectedRecord: null,
    isSelectedRecordModalVisible: false,
    isDescriptionModalVisible: false,
    description: '',
    isLoading: true,
    isUploading: false,
  });
  const screens = useBreakpoint();

  const fetchRecords = useCallback(async () => {
    updateState({ isLoading: true });
    try {
      const records = await contract.getMedicalRecords(patientAddress);
      const recordsInfo = await Promise.all(
        records.map(async (record) => ({
          filename: record[0],
          description: record[1],
          fileFormat: record[2],
          fileSize: record[3],
          sha256: record[4],
          createdAt: Number(record[5]),
          createdBy: record[6],
          updatedAt: Number(record[7]),
          lastUpdatedBy: record[8],
          cid: record[9],
          sig: record[10],
        }))
      );
      const formattedRecords = recordsInfo.map((record, index) => ({
        key: index,
        title: record.filename,
        description: record.description,
        fileUrl: pinata.getIPFSUrl(record.cid),
        date: new Date(Number(record.createdAt) * 1000).toLocaleDateString(),
        type: record.fileFormat,
        size: record.fileSize,
        sha256: record.sha256,
        uploadedBy: record.createdBy,
        lastUpdatedBy: record.lastUpdatedBy,
        sig: record.sig,
      }));
      updateState({ records: formattedRecords, isLoading: false });
    } catch (error) {
      console.error(error);
      message.error('Error fetching records');
      updateState({ isLoading: false });
    }
  }, [contract]);

  const getModalContent = (record) => {
    switch (getFileCategory(record?.type)) {
      case 'text':
      case 'pdf':
      case 'word':
      case 'excel':
      case 'ppt':
        return (
          <iframe
            src={record.fileUrl}
            style={{ width: '100%', height: '500px', border: 0 }}
            title={record.title}
          />
        );
      case 'image':
        return (
          <img
            src={record.fileUrl}
            alt={record.title}
            style={{ width: '100%', height: 'auto' }}
          />
        );
      default:
        return null;
    }
  };

  const getRecordIcon = (type) => {
    const category = getFileCategory(type);
    switch (category) {
      case 'text':
        return <FileTextOutlined style={{ fontSize: 32, color: '#40a9ff' }} />;
      case 'image':
        return <FileImageOutlined style={{ fontSize: 32, color: '#52c41a' }} />;
      case 'pdf':
        return <FilePdfOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />;
      case 'word':
        return <FileWordOutlined style={{ fontSize: 32, color: '#1890ff' }} />;
      case 'excel':
        return <FileExcelOutlined style={{ fontSize: 32, color: '#52c41a' }} />;
      case 'ppt':
        return <FilePptOutlined style={{ fontSize: 32, color: '#fa8c16' }} />;
      default:
        return <FileUnknownOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />;
    }
  };

  const onFileUpload = async () => {
    updateState({
      isUploading: true,
      isDescriptionModalVisible: true,
    })
  };

  const encryptFile = async (file) => {
    const sha256 = await generateFileSHA256(file);
    const privateKey = await contract.getPrivateKey();
    let secretKey;
    if (Number(user.role) === 2) {
      const encryptedSecretKey = await contract.getEncryptedSecretKey(patientAddress);
      secretKey = decryptSecretKey(encryptedSecretKey, privateKey);
    } else if (Number(user.role) === 3) {
      secretKey = await contract.getSecretKey();
    }
    if (!secretKey) {
      updateState({ isUploading: false });
      return new Error('Error getting secret key');
    }
    const signature = await signMessage(privateKey, sha256);
    const fileBuffer = await file.arrayBuffer();
    const encryptedFile = await encryptDataWithSecretKey(secretKey, fileBuffer);
    return { sha256, signature, encryptedFile };
  }

  const decryptFile = async (record) => {
    const response = await fetch(record.fileUrl);
    const encryptedData = await response.text();
    let secretKey;
    if (Number(user.role) === 2) {
      const encryptedSecretKey = await contract.getEncryptedSecretKey(patientAddress);
      const doctorPrivateKey = await contract.getPrivateKey();
      secretKey = decryptSecretKey(encryptedSecretKey, doctorPrivateKey);
    } else if (Number(user.role) === 3) {
      secretKey = await contract.getSecretKey();
    }
    if (!secretKey) {
      return new Error('Error getting secret key');
    }
    const decryptedData = await decryptDataWithSecretKey(secretKey, encryptedData);
    return decryptedData;
  }

  const handleDescriptionSubmit = async () => {
    updateState({ isDescriptionModalVisible: false });
    message.loading('Uploading file...');
    try {
      const file = state.fileList[0];
      const startTime = Date.now();
      const { sha256, signature, encryptedFile } = await encryptFile(file);
      const endTime = Date.now();
      const encryptionTime = endTime - startTime;
      await apiClient.post('/analytics/encryption?time=' + encryptionTime);
      const hash = await pinata.uploadToIPFS(encryptedFile);
      const tx = await contract.addMedicalRecord(
        patientAddress,
        file.name,
        state.description,
        file.type,
        file.size,
        sha256,
        hash,
        signature
      );
      await tx.wait();
      message.success('File uploaded successfully');
      updateState({ fileList: [], description: '', isUploading: false });
      await fetchRecords();
    } catch (error) {
      console.error(error);
      message.error('Error uploading file');
      updateState({ isUploading: false });
    }
  };

  const handleShowContent = async (record) => {
    try {
      const startTime = Date.now();
      const decryptedData = await decryptFile(record);
      const endTime = Date.now();
      const decryptionTime = endTime - startTime;
      await apiClient.post('/analytics/decryption?time=' + decryptionTime);
      const binaryArray = Uint8Array.from(decryptedData, char => char.charCodeAt(0));
      const blob = new Blob([binaryArray], { type: record.type });
      const file = new File([blob], record.title, { type: record.type });
      const publicKey = await contract.getPublicKey(record.lastUpdatedBy);
      const isSignatureValid = await verifySignedMessage(publicKey, record.sha256, record.sig);
      const isHashValid = await verifyFileSHA256(file, record.sha256);
      if (!isSignatureValid || !isHashValid) {
        message.error('File has been tampered');
        return;
      }
      const fileUrl = URL.createObjectURL(blob);
      updateState({ 
        selectedRecord: { ...record, fileUrl }, 
        isSelectedRecordModalVisible: true 
      });
    } catch (error) {
      console.error(error);
      message.error('Error fetching file');
    }
  };

  const handleCloseModal = () => {
    updateState({ isSelectedRecordModalVisible : false, selectedRecord: null });
  };

  useEffect(() => {
    fetchRecords();
  }, [contract, fetchRecords]);

  return (
    <>
      <FileUpload state={state} updateState={updateState} onUpload={onFileUpload}/>
      <Col span={24}>
        {state.isLoading ? (
          <Spin size='large' fullscreen={true} />
        ) : (
          <Card bordered={true}>
            <Title level={4} style={{ marginBottom: 20 }}>
              SUPPLY Records
            </Title>
              <List
                itemLayout={screens.xs ? 'vertical' : 'horizontal'}
                dataSource={state.records}
                renderItem={(record) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={getRecordIcon(record.type)}
                      title={
                        <span style={{ fontSize: screens.xs ? '14px' : '15px', fontWeight: 'bold' }}>
                          {record.title}
                        </span>
                      }
                      description={
                        <span style={{ fontSize: screens.xs ? '12px' : '13px' }}>
                          Date: {record.date} 
                          <br />
                          Uploaded By: {record.uploadedBy}
                        </span>
                      }
                    />
                    <Row gutter={16} justify='center'>
                      <Col>
                        <Button
                          key={record.key}
                          type='primary'
                          icon={<EyeOutlined />}
                          onClick={() => handleShowContent(record)}
                          size={screens.xs ? 'middle' : 'large'}
                        >
                          View
                        </Button>
                      </Col>
                    </Row>
                  </List.Item>
                )}
              />
          </Card>
        )}
      </Col>
      <Modal
        title='Enter File Description'
        open={state.isDescriptionModalVisible}
        onOk={handleDescriptionSubmit}
        onCancel={() => updateState({ isDescriptionModalVisible: false, uploadingFile: null })}
      >
        <Input.TextArea
          placeholder='Description of the file'
          value={state.description}
          onChange={(e) => updateState({ description: e.target.value })}
          rows={4}
        />
      </Modal>
      <Modal
        title={state.selectedRecord?.title}
        open={state.isSelectedRecordModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={screens.xs ? '90%' : '70%'}
      >
        <Typography>
          <Text strong>Description: </Text>{state.selectedRecord?.description}
          <br />
          <Text strong>Date: </Text>{state.selectedRecord?.date}
          <br />
          <Text strong>Uploaded By: </Text>{state.selectedRecord?.uploadedBy}
        </Typography>
        {getModalContent(state.selectedRecord)}
      </Modal>
    </>
  );
};

RecordList.propTypes = {
    patientAddress: PropTypes.string.isRequired,
};

export default RecordList;
