import { useCallback, useEffect } from 'react';
import { Col, message, Spin, Card, Typography, Row } from 'antd';

import ContentLayout from '@components/ContentLayout';
import useContract from '@hooks/useContract';
import useCustomState from '@hooks/useCustomState';

const { Title } = Typography;

const Users = () => {
  const contract = useContract();
  const [state, updateState] = useCustomState({
    patientsCount: 0,
    doctorsCount: 0,
    isLoading: true,
  });

  const fetchUsersCount = useCallback(async () => {
    try {
      const patientsCount = Number(await contract.getPatientsCount());
      const doctorsCount = Number(await contract.getDoctorsCount());
      updateState({ patientsCount, doctorsCount, isLoading: false });
    } catch (error) {
      console.log(error);
      message.error('Error fetching users count');
      updateState({ isLoading: false });
    }
  }, [contract]);

  useEffect(() => {
    fetchUsersCount();
  }, [contract, fetchUsersCount]);

  return (
    <ContentLayout>
      <Col span={24}>
        {state.isLoading ? (
          <Spin size='large' fullscreen={true} />
        ) : (
          <Row gutter={[16, 24]}>
            <Col xs={24} sm={12}>
              <Card title="Total Suppliers" bordered>
                <Title level={3}>{state.doctorsCount}</Title>
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card title="Total users" bordered>
                <Title level={3}>{state.patientsCount}</Title>
              </Card>
            </Col>
          </Row>
        )}
      </Col>
    </ContentLayout>
  )
}

export default Users