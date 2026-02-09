import PropTypes from 'prop-types';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Layout, Button, Breadcrumb, Grid, Row, Col, Typography } from 'antd';
import { MenuOutlined, LogoutOutlined, WalletOutlined } from '@ant-design/icons';

import useIsLoggedIn from '@hooks/useIsLoggedIn';
import useWallet from '@hooks/useWallet';

import Logo from '@assets/image.png';

const { Title } = Typography;
const { Header: AntdHeader } = Layout;
const { useBreakpoint } = Grid;

const Header = ({ onMenuClick = () => {} }) => {
  const isLoggedIn = useIsLoggedIn();
  const { connectWallet, disconnectWallet } = useWallet();
  const screens = useBreakpoint();
  const location = useLocation();
  const navigate = useNavigate();

  const pathnames = location.pathname.split('/').filter(x => x);

  const breadcrumbItems = pathnames.map((name, index) => ({
    path: `/${pathnames.slice(0, index + 1).join('/')}`,
    title: name.charAt(0).toUpperCase() + name.slice(1),
  }));

  const handleConnectWallet = async () => {
    await connectWallet();
    navigate('/dashboard');
  }

  const handleDisconnectWallet = async () => {
    await disconnectWallet();
    navigate('/');
  }

  const itemRender = (currentRoute, _, routes, paths) => {
    currentRoute.title = currentRoute.title
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    const isLast = currentRoute.path === routes[routes.length - 1].path;
    return isLast ? (
      <span>{currentRoute.title}</span>
    ) : (
      <Link to={`/${paths.join('/')}`}>{currentRoute.title}</Link>
    );
  };

  return (
    <AntdHeader className='header'>
      {!isLoggedIn ? (
        <Row align='middle' justify='space-between' style={{ flexWrap: 'nowrap' }}>
          <Col>
            <Row align='middle' style={{ flexWrap: 'nowrap' }}>
              <Col>
                <img src={Logo} alt='logo' width={screens.xs ? 50 : 60} style={{ display: 'flex' }} />
              </Col>
              <Col>
                <Title level={screens.xs ? 4 : 3} style={{ marginBottom: 0, marginLeft: screens.xs ? 10 : 15 }}>
                  SUPPLY CHAIN
                </Title>
              </Col>
            </Row>
          </Col>
          <Col>
            <Row align='middle' style={{ flexWrap: 'nowrap' }}>
              <Col>
                <Button
                  type='primary'
                  icon={<WalletOutlined />}
                  size={screens.xs ? 'middle' : 'large'}
                  onClick={handleConnectWallet}
                >
                  Connect Wallet
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      ) : (
        <Row align='middle' justify='space-between' style={{ flexWrap: 'nowrap' }}>
          <Col>
            <Row align='middle' style={{ flexWrap: 'nowrap' }}>
              <Col>
                <Button
                  icon={<MenuOutlined />}
                  onClick={onMenuClick}
                  className='sidebar-toggler'
                />
              </Col>
              <Col>
                <Breadcrumb 
                  itemRender={itemRender} 
                  items={breadcrumbItems}
                  style={{ marginLeft: screens.lg ? 0 : 10, fontSize: 16 }}
                />
              </Col>
            </Row>
          </Col>
          <Col>
            <Row align='middle' style={{ flexWrap: 'nowrap' }}>
              <Col>
                <Button
                  type='primary'
                  icon={<LogoutOutlined />}
                  size={screens.xs ? 'middle' : 'large'}
                  onClick={handleDisconnectWallet}
                >
                  Logout
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      )}
    </AntdHeader>
  );
};

Header.propTypes = {
  onMenuClick: PropTypes.func,
};

export default Header;
