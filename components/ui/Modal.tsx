"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";
import { LogoutIcon } from "@/lib/svg";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "default" | "danger";
  showCancel?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "default",
  showCancel = true,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[14px] p-4 sm:p-6 max-w-[400px] w-full max-h-[85vh] overflow-y-auto shadow-lg text-center flex flex-col items-center justify-center my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <LogoutIcon color="#E7000B" className="w-10 h-10 sm:w-12 sm:h-12 shrink-0" />
        <h3 className="text-lg sm:text-[20px] font-semibold text-[#030200] mt-2 mb-1 sm:my-2">
          {title}
        </h3>
        <p className="text-[13px] sm:text-[14px] text-[#6F7B8F] mb-4 sm:mb-6">{message}</p>
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 w-full">
          {showCancel && (
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={onClose}
              className="flex-1 w-full sm:w-auto"
            >
              {cancelText}
            </Button>
          )}
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            size="lg"
            fullWidth
            onClick={onConfirm}
            className="flex-1 w-full sm:w-auto"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};

export default Modal;
