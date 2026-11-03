import React from 'react';
import { LoginForm } from '../features/auth/components/LoginForm/LoginForm';

const Login: React.FC = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <LoginForm />
    </div>
  );
};

export default Login;