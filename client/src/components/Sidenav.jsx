import { useNavigate } from 'react-router-dom';
import { Menu } from 'antd';
import {
  UserOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  SolutionOutlined,
  UserAddOutlined,
  TeamOutlined,
  LineChartOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';

import useUser from '@hooks/useUser';

const Sidenav = () => {
  const user = useUser();
  const navigate = useNavigate();

  const handleMenuClick = (path) => {
    navigate('/dashboard' + path);
  };

  const menuItems = {
    1: [
      {
        key: 'profile',
        label: <span className='menu-heading'>Profile Section</span>,
        type: 'group',
        children: [
          {
            key: '1',
            label: 'Profile',
            icon: <UserOutlined />,
            onClick: () => handleMenuClick('/profile'),
          },
        ],
      },
      {
        key: 'doctor-management',
        label: <span className='menu-heading'>Supply Management</span>,
        type: 'group',
        children: [
          {
            key: '2',
            label: 'Register Supplier',
            icon: <UserAddOutlined />,
            onClick: () => handleMenuClick('/register-doctor'),
          },
        ],
      },
      {
        key: 'analytics',
        label: <span className='menu-heading'>Analytics</span>,
        type: 'group',
        children: [
          {
            key: '3',
            label: 'Users',
            icon: <TeamOutlined />,
            onClick: () => handleMenuClick('/users'),
          },
          {
            key: '4',
            label: 'View Logs',
            icon: <FileTextOutlined />,
            onClick: () => handleMenuClick('/logs'),
          },
          {
            key: '5',
            label: 'View Performance',
            icon: <LineChartOutlined />,
            onClick: () => handleMenuClick('/performance'),
          },
        ],
      },
    ],
    2: [
      {
        key: 'profile',
        label: <span className='menu-heading'>Profile Section</span>,
        type: 'group',
        children: [
          {
            key: '1',
            label: 'Profile',
            icon: <UserOutlined />,
            onClick: () => handleMenuClick('/profile'),
          },
        ],
      },
      {
        key: 'patient-management',
        label: <span className='menu-heading'>User Management</span>,
        type: 'group',
        children: [
          {
            key: '2',
            label: 'Patients',
            icon: <SolutionOutlined />,
            onClick: () => handleMenuClick('/patients'),
          },
          {
            key: '3',
            label: 'Register Patient',
            icon: <UserAddOutlined />,
            onClick: () => handleMenuClick('/register-patient'),
          },
        ],
      },
    ],
    3: [
      {
        key: 'profile',
        label: <span className='menu-heading'>Profile Section</span>,
        type: 'group',
        children: [
          {
            key: '1',
            label: 'Profile',
            icon: <UserOutlined />,
            onClick: () => handleMenuClick('/profile'),
          },
        ],
      },
      {
        key: 'records-and-access',
        label: <span className='menu-heading'>Records and Access</span>,
        type: 'group',
        children: [
          {
            key: '2',
            label: 'View Records',
            icon: <FileSearchOutlined />,
            onClick: () => handleMenuClick('/records'),
          },
          {
            key: '3',
            label: 'Doctors',
            icon: <MedicineBoxOutlined />,
            onClick: () => handleMenuClick('/doctors'),
          },
        ],
      },
    ],
  };

  return (
    <Menu
      mode='inline'
      items={menuItems[Number(user.role)]}
      defaultSelectedKeys={['1']}
    />
  )
}

export default Sidenav;
