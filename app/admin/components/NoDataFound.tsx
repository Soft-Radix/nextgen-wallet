"use client";

import { Loader } from "./Loader";

const documentIcon = (
  <svg
    className="w-10 h-10 text-[#CBD5E1]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);

type NoDataFoundProps = {
  message?: string;
  subMessage?: string;
};

/** Standalone block (e.g. for chart area or cards). Aligns with admin color/style. */
export function NoDataFoundBlock({ message = "No data found", subMessage }: NoDataFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12">
      {documentIcon}
      <p className="text-sm font-medium text-[#6F7B8F]">{message}</p>
      {subMessage && <p className="text-xs text-[#94A3B8]">{subMessage}</p>}
    </div>
  );
}

/** Table row for empty state. Use inside <tbody>. */
export function NoDataFoundRow({
  colSpan,
  message = "No data found",
  subMessage,
}: NoDataFoundProps & { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center">
        <div className="flex flex-col items-center justify-center gap-2">
          {documentIcon}
          <p className="text-sm font-medium text-[#6F7B8F]">{message}</p>
          {subMessage && <p className="text-xs text-[#94A3B8]">{subMessage}</p>}
        </div>
      </td>
    </tr>
  );
}

/** Table row for loading state. Use inside <tbody>. */
export function LoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center">
        <div className="flex items-center justify-center">
          <Loader size="lg" />
        </div>
      </td>
    </tr>
  );
}
