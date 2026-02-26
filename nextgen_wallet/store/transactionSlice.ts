import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ApiHelperFunction } from "@/lib/api/client";

type TransferPayload = {
  sender_id: string;
  receiver_id?: string | null;
  receiver_phone?: string | null;
  amount: number;
  note?: string | null;
};

type TransactionState = {
  transactionId: string | null;
  loading: boolean;
  error: string | null;
};

const initialState: TransactionState = {
  transactionId: null,
  loading: false,
  error: null,
};

type TransferResponse = {
  transaction_id: string;
};

export const AddTransaction = createAsyncThunk<
  TransferResponse,
  TransferPayload,
  { rejectValue: string }
>("transactions/transfer", async (payload, { rejectWithValue }) => {
  try {
    const response = await ApiHelperFunction<TransferResponse>({
      url: "transfer-money", // 👈 no leading /api
      method: "post",
      data: {
        sender_id: payload.sender_id,
        receiver_id: payload.receiver_id ?? null,
        receiver_phone: payload.receiver_phone ?? null,
        amount: payload.amount,
        note: payload.note ?? null,
      },
    });

    return response.data;
  } catch (err) {
    const message =
      (err as any)?.response?.data?.error ||
      (err as any)?.message ||
      "Something went wrong";
    return rejectWithValue(message);
  }
});

const TransactionSlice = createSlice({
  name: "Transaction",
  initialState,
  reducers: {
    EmptyError: (state) => {
      state.error = null;
    },
    ResetTransaction: (state) => {
      state.transactionId = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(AddTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        AddTransaction.fulfilled,
        (state, action: PayloadAction<TransferResponse>) => {
          state.loading = false;
          state.transactionId = action.payload.transaction_id;
        }
      )
      .addCase(AddTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Something went wrong";
      });
  },
});

export default TransactionSlice.reducer;
export const { EmptyError, ResetTransaction } = TransactionSlice.actions;
