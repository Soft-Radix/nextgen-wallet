import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ApiHelperFunction } from "@/lib/api/client";

type TransferPayload = {
  sender_id: string;
  receiver_id?: string | null;
  receiver_phone?: string | null;
  amount: number;
  note?: string | null;
  pin: string;
};

type DraftTransfer = {
  receiver_id?: string | null;
  receiver_phone?: string | null;
  amount: number;
  note?: string | null;
};

type TransactionState = {
  transactionId: string | null;
  loading: boolean;
  error: string | null;
  draftTransfer: DraftTransfer | null;
};

type TransferResponse = {
  transaction_id: string;
};

const TRANSACTION_STORAGE_KEY = "transaction_state";

const defaultState: TransactionState = {
  transactionId: null,
  loading: false,
  error: null,
  draftTransfer: null,
};

function loadInitialState(): TransactionState {
  if (typeof window === "undefined") {
    return defaultState;
  }
  try {
    const raw = localStorage.getItem(TRANSACTION_STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<TransactionState>;
    return {
      ...defaultState,
      ...parsed,
    };
  } catch {
    return defaultState;
  }
}

function saveState(state: TransactionState) {
  if (typeof window === "undefined") return;
  const toStore: Partial<TransactionState> = {
    transactionId: state.transactionId,
    draftTransfer: state.draftTransfer,
  };
  localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(toStore));
}

function clearState() {
  if (typeof window == "undefined") return;
  localStorage.removeItem(TRANSACTION_STORAGE_KEY);
}

const initialState: TransactionState = loadInitialState();

export const AddTransaction = createAsyncThunk<
  TransferResponse,
  TransferPayload,
  { rejectValue: string }
>("transactions/transfer", async (payload, { rejectWithValue }) => {
  try {
    const response = await ApiHelperFunction<TransferResponse>({
      url: "transfer-money",
      method: "post",
      data: {
        sender_id: payload.sender_id,
        receiver_id: payload.receiver_id ?? null,
        receiver_phone: payload.receiver_phone ?? null,
        amount: payload.amount,
        note: payload.note ?? null,
        pin: payload.pin,
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
      saveState(state);
    },
    ResetTransaction: (state) => {
      state.transactionId = null;
      state.error = null;
      state.loading = false;
      state.draftTransfer = null;
      clearState();
    },
    setDraftTransfer: (state, action: PayloadAction<DraftTransfer>) => {
      state.draftTransfer = action.payload;
      saveState(state);
    },
    clearDraftTransfer: (state) => {
      state.draftTransfer = null;
      saveState(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(AddTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
        saveState(state);
      })
      .addCase(
        AddTransaction.fulfilled,
        (state, action: PayloadAction<TransferResponse>) => {
          state.loading = false;
          state.transactionId = action.payload.transaction_id;
          saveState(state);
        }
      )
      .addCase(AddTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Something went wrong";
        saveState(state);
      });
  },
});

export default TransactionSlice.reducer;
export const {
  EmptyError,
  ResetTransaction,
  setDraftTransfer,
  clearDraftTransfer,
} = TransactionSlice.actions;
