import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register    = (data) => API.post('/auth/register', data);
export const verifyOTP   = (data) => API.post('/auth/verify-otp', data);
export const login       = (data) => API.post('/auth/login', data);
export const updateProfile = (data) => API.put('/auth/profile', data);
export const deleteAccount = ()     => API.delete('/auth/account');

// Senders
export const getSenders    = ()         => API.get('/senders');
export const getSenderById = (id)       => API.get(`/senders/${id}`);
export const createSender  = (data)     => API.post('/senders', data);
export const updateSender  = (id, data) => API.put(`/senders/${id}`, data);
export const deleteSender  = (id)       => API.delete(`/senders/${id}`);

// Receivers
export const getReceivers    = ()         => API.get('/receivers');
export const getReceiverById = (id)       => API.get(`/receivers/${id}`);
export const createReceiver  = (data)     => API.post('/receivers', data);
export const updateReceiver  = (id, data) => API.put(`/receivers/${id}`, data);
export const deleteReceiver  = (id)       => API.delete(`/receivers/${id}`);
export const getProvinces    = ()         => API.get('/receivers/provinces');
export const getDistricts    = (province) => API.get(`/receivers/districts/${encodeURIComponent(province)}`);
export const getBanks        = ()         => API.get('/receivers/banks');

// Transactions
export const calculateFee  = (data) => API.post('/transactions/calculate-fee', data);
export const sendMoney     = (data) => API.post('/transactions/send', data);
export const lookupPIN     = (data) => API.post('/transactions/lookup-pin', data);
export const receiveMoney  = (data) => API.post('/transactions/receive', data);
export const getTransactions = (params) => API.get('/transactions', { params });
export const markAsPaid    = (id)   => API.put(`/transactions/${id}/mark-paid`);