import axios, { type InternalAxiosRequestConfig } from "axios";

const RAW_BACKEND_API_URL = import.meta.env.VITE_BACKEND_API || "/api";

export const API_BASE_URL = RAW_BACKEND_API_URL.replace(/\/+$/, "");
export const API_ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, "");
export const COMPANY_API_BASE_URL = `${API_BASE_URL}/company`;

const attachCompanyHeader = (config: InternalAxiosRequestConfig) => {
  const companyId = localStorage.getItem("selectedCompanyId");

  if (companyId) {
    config.headers.set("x-company-id", companyId);
  }

  config.withCredentials = true;
  return config;
};

let axiosConfigured = false;

export const configureAxiosDefaults = () => {
  if (axiosConfigured) {
    return;
  }

  axios.defaults.baseURL = API_ROOT_URL;
  axios.defaults.withCredentials = true;
  axios.interceptors.request.use(attachCompanyHeader);
  axiosConfigured = true;
};

export const apiClient = axios.create({
  baseURL: API_ROOT_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use(attachCompanyHeader);
