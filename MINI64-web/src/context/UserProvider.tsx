import { useState, ReactNode } from "react";
import { UserContext } from "./UserContext";
import type { User } from "./UserContext"; // ✅ fix TS1484

type Props = {
  children: ReactNode; // ✅ fix any
};

export const UserProvider = ({ children }: Props) => {
  // ✅ Lazy initializer (không cần useEffect)
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user_info");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
