import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout, Drawer, Typography, Grid, Divider } from 'antd';

import Header from './Header';
import Footer from './Footer';
import Sidenav from './Sidenav';

import Logo from '@assets/logo-nobg.png';

const { Sider, Content } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

const MainLayout = () => {
  const [visible, setVisible] = useState(false);
  const screens = useBreakpoint();
  
  const toggleDrawer = () => setVisible(!visible);

  const renderSidenav = () => {
    return (
      <div>
        <div className='sider-top'>
          <img src={Logo} alt='logo' width={50} />
          <Title level={screens.xs ? 5 : 4} style={{ margin: '10px 0' }}>
            SUPPLY CHAIN
          </Title>
        </div>
        <Divider style={{ marginTop: 0, marginBottom: 5 }} />
        <Sidenav />
      </div>
    )
  }

  return (
    <Layout className='layout-dashboard'>
      <Drawer
        title={null}
        placement='left'
        closable={false}
        open={visible}
        onClose={toggleDrawer}
        width={250}
        className='drawer'
      >
        {renderSidenav()}
      </Drawer>

      <Sider
        breakpoint='lg'
        collapsedWidth='0'
        trigger={null}
        width={270}
        theme='light'
        className='sider'
        style={{
          position: 'fixed',
          height: '100vh',
          top: 0,
          left: 0,
        }}
      >
        {renderSidenav()}
      </Sider>

      <Layout>
        <Header onMenuClick={toggleDrawer} />
        <Content>
          <Outlet />
        </Content>
        <Footer />
      </Layout>
    </Layout>
  )
}

export default MainLayout;
