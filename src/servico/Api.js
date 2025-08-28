import axios from "axios";
import cookie from "js-cookie";

const Api = axios.create({
  baseURL: "https://financias-back-end.onrender.com"
});

// const Api = axios.create({
//   baseURL: "http://localhost:5000"
// }); 

function setTokenAxios() {
  const token = cookie.get("token");
  if (token) {
    Api.defaults.headers.common["token"] = token;
  }
}

Api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {

    if (error.response && error.response.status === 401) {
      cookie.remove('token');
      
      delete Api.defaults.headers['token'];

      window.location.href = '/login'; 
      
      console.error("Sessão expirada, redirecionando para o login.");
    }
    

    return Promise.reject(error);
  }
);
export default {
  setTokenAxios,
  api: Api 
};
