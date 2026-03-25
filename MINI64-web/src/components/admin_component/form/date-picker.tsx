"use client";

import React, { useEffect } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import { CalenderIcon } from "../../../icons";

// ✅ Import đúng chuẩn type-only cho verbatimModuleSyntax
import type { Options } from "flatpickr/dist/types/options";
import type { Instance } from "flatpickr/dist/types/instance";

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  // ✅ Ép kiểu trực tiếp từ Options để tránh lỗi phân cấp Hook
  onChange?: Options["onChange"];
  defaultDate?: Options["defaultDate"];
  label?: string;
  placeholder?: string;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  placeholder,
}: PropsType) {
  useEffect(() => {
    // ✅ Khởi tạo với config được ép kiểu chuẩn Options
    const config: Options = {
      mode: mode || "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate: defaultDate,
      onChange: onChange,
    };

    // flatpickr trả về Instance hoặc Instance[] tùy vào selector
    const fp = flatpickr(`#${id}`, config) as Instance | Instance[];

    return () => {
      // ✅ Kiểm tra và destroy an toàn
      if (Array.isArray(fp)) {
        fp.forEach((instance) => instance.destroy());
      } else if (fp && typeof fp.destroy === "function") {
        fp.destroy();
      }
    };
  }, [mode, onChange, id, defaultDate]);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          // Huy nhớ thêm readOnly hoặc để flatpickr điều khiển để tránh lỗi gõ phím tay
          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800"
        />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
}
