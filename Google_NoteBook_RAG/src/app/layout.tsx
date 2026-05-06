import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Google NotebookLM RAG",
  description:
    "Upload a PDF or text file and chat with it using a RAG pipeline (Qdrant + OpenRouter).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
