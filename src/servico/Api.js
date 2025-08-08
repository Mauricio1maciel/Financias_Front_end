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

export default {
  setTokenAxios,
  api: Api 
};
