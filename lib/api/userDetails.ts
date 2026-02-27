export type UserDetails = {
  id: string;
  mobile_number: string;
  country_code: string;
  full_number?: string;
  pin?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string | null;
  wallet_balance?: number;
  wallet_currency?: string | null;
};

import { ApiHelperFunction } from "@/lib/api/client";

type UserDetailsResponse = {
  user: UserDetails;
  wallet_balance?: number;
  wallet_currency?: string | null;
};

export async function apiCreateUserDetails(
  mobile_number: string,
  country: string,
  email?: string
): Promise<UserDetails> {
  const response = await ApiHelperFunction<UserDetailsResponse>({
    url: "user-details",
    method: "post",
    data: { mobile_number, country_code: country, email },
  });

  return {
    ...response.data.user,
    wallet_balance: response.data.wallet_balance,
    wallet_currency: response.data.wallet_currency,
  };
}

export async function apiGetUserDetails(
  id: string,
  mobile_number: string,
  country: string
): Promise<UserDetails> {
  const response = await ApiHelperFunction<UserDetailsResponse>({
    url: "user-details",
    method: "get",
    config: {
      params: {
        id,
        mobile_number,
        country_code: country,
      },
    },
  });

  return {
    ...response.data.user,
    wallet_balance: response.data.wallet_balance,
    wallet_currency: response.data.wallet_currency,
  };
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

  return {
    ...response.data.user,
    wallet_balance: response.data.wallet_balance,
    wallet_currency: response.data.wallet_currency,
  };
}
