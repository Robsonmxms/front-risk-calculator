import "./globals.css";
import { AuthProvider } from "../features/auth/AuthProvider";

export const metadata = {
  title: "Risk Calculator",
  description: "Investment portfolio analytics platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
