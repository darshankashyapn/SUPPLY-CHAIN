import { Radio, Form, Input, Button, Col, Card, Typography, message } from 'antd';

import ContentLayout from '@components/ContentLayout';
import AvatarUpload from '@components/AvatarUpload';
import useContract from '@hooks/useContract';
import useCustomState from '@hooks/useCustomState';
import { pinata } from '@services/pinata';

const { Title } = Typography;

const RegisterPatient = () => {
  const contract = useContract();
  const [form] = Form.useForm();
  const [state, updateState] = useCustomState({
    fileList: [],
    isSubmitting: false,
  });

  const onFormFinish = async (values) => {
    updateState({ isSubmitting: true });
    try {
      const hash = await pinata.uploadToIPFS(state.fileList[0].originFileObj);
      const tx = await contract.registerPatient(
        values.walletAddress,
        values.name,
        values.age,
        values.gender,
        values.email,
        values.contactNumber,
        values.healthIssues,
        values.bloodGroup,
        values.aadhaarNumber,
        hash,
        { gasLimit: 1000000 }
      );
      await tx.wait();
      form.resetFields();
      updateState({ fileList: [] });
      message.success('Patient registered successfully!');
    } catch (errorInfo) {
      // TODO: Handle error messages properly
      if (errorInfo.message.includes('transaction execution reverted')) {
        message.error('Patient already registered');
      }
      else {
        message.error('Failed to register Patient');
      }
      console.log('Failed:', errorInfo);
    }
    updateState({ isSubmitting: false });
  }

  const onFormFinishFailed = (errorInfo) => {
    message.error('Failed to register Patient');
    console.log('Failed:', errorInfo);
  }

  const validateAvatar = () => {
    if (state.fileList.length === 0) {
      return Promise.reject(new Error('Please upload the profile picture!'));
    }
    return Promise.resolve();
  };

  return (
    <ContentLayout>
      <Col span={24}>
        <Card bordered={true}>
          <Title level={4} style={{ textAlign: 'center', marginBottom: 20 }}>
            Register New User
          </Title>
          <Form
            form={form}
            name='registerPatient'
            layout='vertical'
            onFinish={onFormFinish}
            onFinishFailed={onFormFinishFailed}
            autoComplete='off'
          >
            <Form.Item
              label='Profile Picture'
              name='avatar'
              style={{ textAlign: 'center' }}
              rules={[{ validator: validateAvatar }]}
              required={true}
            >
              <AvatarUpload state={state} updateState={updateState} /> 
            </Form.Item>
            <Form.Item
              label='Wallet Address'
              name='walletAddress'
              rules={[
                { required: true, message: 'Please input the wallet address!' },
                { pattern: /^0x[a-fA-F0-9]{40}$/, message: 'Please enter a valid wallet address.' },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label='Name'
              name='name'
              rules={[{ required: true, message: 'Please input the name!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label='Age'
              name='age'
              rules={[
                { required: true, message: 'Please input the age!' },
                { pattern: /^\d{1,3}$/, message: 'Please enter a valid age.' },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label='Gender'
              name='gender'
              rules={[{ required: true, message: 'Please input the gender!' }]}
            >
              <Radio.Group>
                <Radio value='Male'>Male</Radio>
                <Radio value='Female'>Female</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              label='Email'
              name='email'
              rules={[
                { required: true, message: 'Please input the email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label='Contact Number'
              name='contactNumber'
              rules={[
                { required: true, message: 'Please input the contact number!' },
                { pattern: /^\d{10}$/, message: 'Please enter a valid 10-digit contact number.' },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label='Health Issues'
              name='healthIssues'
              rules={[{ required: true, message: 'Please input the health issues!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label='Blood Group'
              name='bloodGroup'
              rules={[{ required: true, message: 'Please input the blood group!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label='Aadhaar Number'
              name='aadhaarNumber'
              rules={[
                { required: true, message: 'Please input the aadhaar number!' },
                { pattern: /^\d{12}$/, message: 'Please enter a valid 12-digit aadhaar number.' },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              style={{ textAlign: 'center' }}
            >
              <Button
                type='primary'
                htmlType='submit'
                size='large'
                loading={state.isSubmitting}
              >
                Register
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </ContentLayout>
  )
}

export default RegisterPatient;
