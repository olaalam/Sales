import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ProtAuth = ({ children }) => {
  const token = localStorage.getItem('token');

  if (token) {
    toast.warn('You are already logged in');
    return <Navigate to="/users" />;
  }

  return children;
};

export default ProtAuth;
