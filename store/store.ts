import { configureStore } from "@reduxjs/toolkit";
import userDetailsReducer from "@/store/userDetailsSlice";
import transactionReducer from "@/store/transactionSlice";

export const store = configureStore({
  reducer: {
    userDetails: userDetailsReducer,
    transaction: transactionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
