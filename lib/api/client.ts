import axios, { AxiosRequestConfig, AxiosResponse, Method } from "axios";
import type { AppDispatch } from "@/store/store";
import { logoutUser } from "@/lib/utils/bootstrapRedirect";

type ApiHelperConfig = {
  url: string;
  method: Method | string;
  data?: any;
  formData?: boolean;
  dispatch?: AppDispatch;
  config?: AxiosRequestConfig;
};

// Setup axios interceptor to handle 401 responses
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // User is unauthorized, logout and redirect
      logoutUser();
    }
    return Promise.reject(error);
  }
);

export async function ApiHelperFunction<T = any>({
  url,
  method,
  data,
  formData,
  dispatch, // reserved for future use (e.g. global toasts/logging)
  config,
}: ApiHelperConfig): Promise<AxiosResponse<T>> {
  let payload = data;

  if (formData && data && !(data instanceof FormData)) {
    const fd = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        fd.append(key, value as any);
      }
    });
    payload = fd;
  }

  const response = await axios({
    url: `/api/${url}`,
    method: method as Method,
    data: payload,
    ...config,
  });

  return response;
}

