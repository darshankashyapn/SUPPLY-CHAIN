import { useEffect, useCallback } from 'react';
import { Button, List, Typography, Avatar, Col, Card, message, Spin, Grid, Row } from 'antd';
import { useNavigate } from 'react-router-dom';

import ContentLayout from '@components/ContentLayout';
import useContract from '@hooks/useContract';
import useCustomState from '@hooks/useCustomState';
import { pinata } from '@services/pinata';

const { Title } = Typography;
const { useBreakpoint } = Grid;

const Patients = () => {
  const navigate = useNavigate();
  const contract = useContract();
  const [state, updateState] = useCustomState({
    patients: [],
    isLoading: true,
  });
  const screens = useBreakpoint();

  const fetchPatients = useCallback(async () => {
    try {
      updateState({ isLoading: true });
      const patients = await contract.listPatientsWithAccess();
      const patientInfos = await Promise.all(
        patients.map(async (patientAddress) => {
          const data = await contract.getPatientInfo(patientAddress);
          return {
            address: patientAddress,
            name: data[1],
            age: Number(data[2]),
            gender: data[3],
            photoUrl: pinata.getIPFSUrl(data[9]),
          };
        })
      );
      updateState({ patients: patientInfos });
    } catch (error) {
      console.log(error);
      message.error('Error fetching patients');
    } finally {
      updateState({ isLoading: false });
    }
  } , [contract]);

  useEffect(() => {
    fetchPatients();
  }, [contract, fetchPatients]);

  return (
    <ContentLayout>
      <Col span={24}>
        {state.isLoading ? (
          <Spin size='large' fullscreen={true} />
        ) : (
          <Card bordered={true}>
            <Title level={4} style={{ marginBottom: 20 }}>
              Users with Access
            </Title>
            <List
              itemLayout={screens.xs ? 'vertical' : 'horizontal'}
              dataSource={state.patients}
              renderItem={(patient) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={patient.photoUrl} size={64} />}
                    title={patient.name}
                    description={`Address: ${patient.address} | Age: ${patient.age} | Gender: ${patient.gender}`}
                  />
                  <Row justify='center' gutter={16} style={{ marginTop: screens.xs ? 15 : 0 }}>
                    <Col>
                      <Button
                        type='primary'
                        onClick={() => navigate(patient.address)}
                      >
                        Access Users
                      </Button>
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
          </Card>
        )}
      </Col>
    </ContentLayout>
  )
}

export default Patients;
