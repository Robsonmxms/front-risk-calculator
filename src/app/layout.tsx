import "./globals.css";
import { AuthProvider } from "../features/auth/AuthProvider";

export const metadata = {
  title: "Risk Calculator",
  description: "Plataforma de análises de risco para portfólios de investimento"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
