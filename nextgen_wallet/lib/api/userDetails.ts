export type UserDetails = {
  id: string;
  mobile_number: string;
  country_code: string;
  full_number?: string;
  pin?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string | null;
};

import { ApiHelperFunction } from "@/lib/api/client";

type UserDetailsResponse = {
  user: UserDetails;
};

export async function apiCreateUserDetails(
  mobile_number: string,
  country: string
): Promise<UserDetails> {
  const response = await ApiHelperFunction<UserDetailsResponse>({
    url: "signup",
    method: "post",
    data: { mobile_number, country_code: country },
  });

  return response.data.user;
}

export async function apiGetUserDetails(
  mobile_number: string,
  country: string
): Promise<UserDetails> {
  const response = await ApiHelperFunction<UserDetailsResponse>({
    url: "login",
    method: "get",
    config: {
      params: {
        mobile_number,
        country_code: country,
      },
    },
  });

  return response.data.user;
}

export async function apiUpdateUserPin(
  id: string,
  pin: string
): Promise<UserDetails> {
  const response = await ApiHelperFunction<UserDetailsResponse>({
    url: "user-details",
    method: "patch",
    data: { id, pin },
  });

  return response.data.user;
}
