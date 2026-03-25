"use client";

import React, { useEffect } from "react";

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
  // Đóng modal khi nhấn phím Esc
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-5 backdrop-blur-sm">
      <div
        className={`relative w-full rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 lg:p-10 ${className}`}
        onClick={(e) => e.stopPropagation()} // Ngăn đóng modal khi click vào bên trong
      >
        {/* Nút Close (X) ở góc phải */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 dark:hover:text-white"
        >
          <svg
            className="fill-current"
            width="20"
            height="20"
            viewBox="0 0 20 20"
          >
            <path d="M11.4142 10L16.7071 4.70711C17.0976 4.31658 17.0976 3.68342 16.7071 3.29289C16.3166 2.90237 15.6834 2.90237 15.2929 3.29289L10 8.58579L4.70711 3.29289C4.31658 2.90237 3.68342 2.90237 3.29289 3.29289C2.90237 3.68342 2.90237 4.31658 3.29289 4.70711L8.58579 10L3.29289 15.2929C2.90237 15.6834 2.90237 16.3166 3.29289 16.7071C3.68342 17.0976 4.31658 17.0976 4.70711 16.7071L10 11.4142L15.2929 16.7071C15.6834 17.0976 16.3166 17.0976 16.7071 16.7071C17.0976 16.3166 17.0976 15.6834 16.7071 15.2929L11.4142 10Z" />
          </svg>
        </button>

        {title && (
          <h3 className="mb-4 text-xl font-bold text-black dark:text-white">
            {title}
          </h3>
        )}

        <div className="custom-scrollbar max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>

      {/* Click ra ngoài để đóng */}
      <div className="fixed inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
};

export default Modal;
