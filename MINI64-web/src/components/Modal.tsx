"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = "max-w-[500px]",
}) => {
  // 1. Dùng state này để đợi trang web load xong trên trình duyệt
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Chỉ chạy khi đã ở phía Client

    if (isOpen) {
      document.body.style.overflow = "hidden"; // Khóa cuộn trang
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset"; // Mở lại cuộn trang
    };
  }, [isOpen, onClose]);

  // Nếu chưa load xong hoặc modal đang đóng thì không làm gì cả
  if (!mounted || !isOpen) return null;

  // 2. Dùng createPortal để "bắn" Modal ra khỏi mọi thẻ div khác, đưa nó thẳng vào <body>
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 999999 }} // Số cực lớn để đè lên Header
    >
      {/* Lớp nền đen mờ (Backdrop) */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Nội dung Modal - Cái này mới là cái chứa Form của bạn */}
      <div
        className={`relative z-[1000000] w-full rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 lg:p-10 animate-in fade-in zoom-in duration-200 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng (X) */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 dark:hover:text-white"
        >
          <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11.4142 10L16.7071 4.70711C17.0976 4.31658 17.0976 3.68342 16.7071 3.29289C16.3166 2.90237 15.6834 2.90237 15.2929 3.29289L10 8.58579L4.70711 3.29289C4.31658 2.90237 3.68342 2.90237 3.29289 3.29289C2.90237 3.68342 2.90237 4.31658 3.29289 4.70711L8.58579 10L3.29289 15.2929C2.90237 15.6834 2.90237 16.3166 3.29289 16.7071C3.68342 17.0976 4.31658 17.0976 4.70711 16.7071L10 11.4142L15.2929 16.7071C15.6834 17.0976 16.3166 17.0976 16.7071 16.7071C17.0976 16.3166 17.0976 15.6834 16.7071 15.2929L11.4142 10Z" />
          </svg>
        </button>

        {title && (
          <h3 className="mb-5 text-2xl font-bold text-black dark:text-white border-b pb-4">
            {title}
          </h3>
        )}

        {/* Chứa nội dung con (Form, Text...) */}
        <div className="custom-scrollbar max-h-[75vh] overflow-y-auto pr-2">
          {children}
        </div>
      </div>
    </div>,
    document.body, // "Cửa thần kỳ" đưa Modal ra ngoài cùng
  );
};

export default Modal;
