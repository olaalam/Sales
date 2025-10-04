
import axios from "axios";

export const loginAuth = async (emailOrUsername, password) => {
  const response = await axios.post("https://negotia.wegostation.com/api/auth/login", {
    email: emailOrUsername,
    password,
  });
  return response.data;
};
