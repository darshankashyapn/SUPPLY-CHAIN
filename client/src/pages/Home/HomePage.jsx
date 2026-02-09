import { Layout, Button, Typography, Row, Col, Divider, Card, Grid } from 'antd';

import Header from '../../components/Header';
import Footer from '../../components/Footer';

const { Title, Paragraph } = Typography;
const { Content } = Layout;
const { useBreakpoint } = Grid;

const HomePage = () => {
  const screens = useBreakpoint();

  return (
    <Layout>
      <Header />
      <Content className='hero'>
        <div className='hero-content'>
          <Title level={screens.xs ? 2 : 1}>
            Welcome to Supply Chain System
          </Title>
          <Paragraph>
            Our Electronic Supply Records (ESR) system uses blockchain technology to ensure the security and privacy of your supply data.
          </Paragraph>
          <Button type='primary' size='large'>
            Learn More
          </Button>
        </div>
      </Content>
      <Content style={{ padding: '0 24px 24px '}}>
        <Row gutter={[16, 24]} justify={'center'} align={'center'}>
          <Col xs={24} sm={12} md={8}>
            <Card className='content-card' bordered={false}>
              <Title level={screens.xs ? 3 : 2}>Secure</Title>
              <Paragraph>
                Our system ensures that all supply records are encrypted and stored securely on the blockchain. Unauthorized access is prevented through robust security protocols.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card className='content-card' bordered={false}>
              <Title level={screens.xs ? 3 : 2}>Transparent</Title>
              <Paragraph>
                With blockchain technology, every transaction is recorded and can be traced for added transparency. 
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card className='content-card' bordered={false}>
              <Title level={screens.xs ? 3 : 2}>Efficient</Title>
              <Paragraph>
                Streamline data access and sharing with an efficient and decentralized system. Reduce paperwork and administrative overhead with our automated processes.
              </Paragraph>
            </Card>
          </Col>
        </Row>
        <Divider />
        <Row gutter={[16, 24]} justify={'center'} align={'center'}>
          <Col xs={24} lg={12}>
            <Card className='content-card' bordered={false} style={{ height: '100%' }}>
              <Title level={screens.xs ? 3 : 2}>Features</Title>
              <Paragraph>
                Decentralized Storage: Ensure data integrity and reliability with decentralized storage.
              </Paragraph>
              <Paragraph>
                Smart Contracts: Automate and enforce permissions through smart contracts.
              </Paragraph>
              <Paragraph>
                Interoperability: Seamlessly integrate with existing healthcare systems and standards.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card className='content-card' bordered={false} style={{ height: '100%' }}>
              <Title level={screens.xs ? 3 : 2}>Get Started</Title>
              <Paragraph>
                Ready to experience the future of supply? Get started with our ESR system today. Contact us to schedule a demo or request more information.
              </Paragraph>
              <Button type='primary'>Contact Us</Button>
            </Card>
          </Col>
        </Row>
      </Content>
      <Footer />
    </Layout>
  )
}

export default HomePage;
