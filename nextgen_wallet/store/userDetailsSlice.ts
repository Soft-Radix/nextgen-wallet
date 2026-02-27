import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  apiCreateUserDetails,
  apiGetUserDetails,
  apiUpdateUserPin,
  type UserDetails,
} from "@/lib/api/userDetails";

type UserDetailsState = {
  user: UserDetails | null;
  loading: boolean;
  error: string | null;
};

const initialState: UserDetailsState = {
  user: null,
  loading: false,
  error: null,
};

export const createUserDetails = createAsyncThunk<
  UserDetails,
  { mobile_number: string; country: string },
  { rejectValue: string }
>("userDetails/create", async ({ mobile_number, country }, { rejectWithValue }) => {
  try {
    return await apiCreateUserDetails(mobile_number,country);
  } catch (err: any) {
    const message =
      err?.response?.data?.error ??
      err?.message ??
      "Failed to start signup process";
    return rejectWithValue(message);
  }
});

export const loginUser = createAsyncThunk<
  UserDetails,
  {id?: string, mobile_number?: string; country?: string },
  { rejectValue: string }
>("userDetails/login", async ({ id, mobile_number, country }, { rejectWithValue }) => {
  try {
    return await apiGetUserDetails(id || "", mobile_number || "", country || "");
  } catch (err: any) {
    const message =
      err?.response?.data?.error ?? err?.message ?? "Failed to login";
    return rejectWithValue(message);
  }
});

export const updateUserPin = createAsyncThunk<
  UserDetails,
  { id: string; pin: string },
  { rejectValue: string }
>("userDetails/updatePin", async ({ id, pin }, { rejectWithValue }) => {
  try {
    return await apiUpdateUserPin(id, pin);
  } catch (err: any) {
    const message =
      err?.response?.data?.error ?? err?.message ?? "Failed to update PIN";
    return rejectWithValue(message);
  }
});

const userDetailsSlice = createSlice({
  name: "userDetails",
  initialState,
  reducers: {
    EmptyError: (state) => {
      state.error = null;
    },
    setUserBalanceUpdate: (state, action: PayloadAction<number>) => {

      state.user  =  action.payload as any;
    
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
  },  
  extraReducers: (builder) => {
    builder

      .addCase(createUserDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createUserDetails.fulfilled,
        (state, action: PayloadAction<UserDetails>) => {
          state.loading = false;
          state.user = action.payload;
          localStorage.setItem("country_code", action.payload.country_code || "");
          localStorage.setItem("mobile_number", action.payload.mobile_number || "");
          localStorage.setItem("user", JSON.stringify(action.payload));
        }
      )
      .addCase(createUserDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Something went wrong";
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        loginUser.fulfilled,
        (state, action: PayloadAction<UserDetails>) => {
          state.loading = false;
          state.user = action.payload;
          localStorage.setItem(
            "country_code",
            action.payload.country_code || ""
          );
          localStorage.setItem(
            "mobile_number",
            action.payload.mobile_number || ""
          );
          localStorage.setItem("user", JSON.stringify(action.payload));
        }
      )
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Something went wrong";
      })
      .addCase(updateUserPin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateUserPin.fulfilled,
        (state, action: PayloadAction<UserDetails>) => {
          state.loading = false;
          state.user = action.payload;
          localStorage.setItem("user", JSON.stringify(action.payload));
        }
      )
      .addCase(updateUserPin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Something went wrong";
      });
  },
});

export default userDetailsSlice.reducer;
export const { EmptyError, setUserBalanceUpdate } = userDetailsSlice.actions;
