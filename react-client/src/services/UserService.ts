import axios from 'axios';

const apiUrl = 'http://localhost:8080/api/users';

export const getCurrentUser = async () => {
  const response = await axios.get(`${apiUrl}/me`, { withCredentials: true });
  return response.data;
};