
import axios from "axios";

export const loginAuth = async (emailOrUsername, password) => {
  const response = await axios.post("https://qpjgfr5x-3000.uks1.devtunnels.ms/api/auth/login", {
    email: emailOrUsername,
    password,
  });
  return response.data;
};
