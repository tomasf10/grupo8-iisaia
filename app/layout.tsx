import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ChatWidget from "@/components/ChatWidget";
import { getUser } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gastos e Ingresos",
  description: "Administrá tus gastos e ingresos",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getUser().catch(() => null);

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {user && (
          <div className="border-b border-zinc-200 dark:border-zinc-800">
            <div className="mx-auto flex max-w-3xl items-center justify-end gap-3 px-4 py-2 text-xs text-zinc-500">
              <span className="truncate">{user.email}</span>
              <form action="/auth/signout" method="post">
                <button className="rounded-md px-2 py-1 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                  Salir
                </button>
              </form>
            </div>
          </div>
        )}
        <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
          {children}
        </main>
        {user && <ChatWidget />}
      </body>
    </html>
  );
}
