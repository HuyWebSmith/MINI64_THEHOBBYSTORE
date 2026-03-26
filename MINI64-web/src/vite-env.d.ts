/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Sau này Huy thêm biến gì vào .env thì khai báo thêm ở đây nhé
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
