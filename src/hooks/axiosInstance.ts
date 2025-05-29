import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:9080',
  timeout: 10000, // 10 segundos de timeout (ajústalo si quieres)
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
