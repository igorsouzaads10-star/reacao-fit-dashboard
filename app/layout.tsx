import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reação Fit — Dashboard de Visitas",
  description: "Dashboard para acompanhar agendamentos de visitas experimentais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
