"use client";

import React, { useEffect } from "react";
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[14px] p-6 max-w-[400px] w-full shadow-lg text-center flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <LogoutIcon color="#E7000B" className="w-100 h-100" />
        <h3 className="text-[20px] font-semibold text-[#030200] my-2">
          {title}
        </h3>
        <p className="text-[14px] text-[#6F7B8F] mb-6">{message}</p>
        <div className="flex gap-3">
          {showCancel && (
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={onClose}
              className="flex-1"
            >
              {cancelText}
            </Button>
          )}
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            size="lg"
            fullWidth
            onClick={onConfirm}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
