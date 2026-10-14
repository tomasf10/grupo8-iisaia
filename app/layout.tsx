import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import ChatWidget from "@/components/ChatWidget";
import Logo, { Wordmark } from "@/components/Logo";
import NavTabs from "@/components/NavTabs";
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

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Vuelto", template: "%s · Vuelto" },
  description: "Lo que entra, lo que sale y lo que te queda.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getUser().catch(() => null);

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-zinc-900 dark:bg-paper-dark dark:text-zinc-100">
        {user && (
          <div className="sticky top-0 z-40 border-b border-zinc-200/70 bg-paper/85 backdrop-blur-md dark:border-zinc-800/70 dark:bg-paper-dark/85">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
              <Link href="/" className="logo-link flex items-center gap-2 text-lg">
                <Logo size={26} />
                <Wordmark />
              </Link>
              <NavTabs className="order-last w-full sm:order-none sm:ml-4 sm:w-auto" />
              <div className="ml-auto flex min-w-0 items-center gap-2">
                <span className="hidden truncate text-xs text-zinc-500 md:block">{user.email}</span>
                <form action="/auth/signout" method="post">
                  <button className="press rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                    Salir
                  </button>
                </form>
              </div>
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
