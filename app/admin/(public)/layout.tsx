import { LogoPublic } from "@/lib/svg";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ['latin'],
})

export default function AdminPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} min-h-screen flex flex-col gap-[30px] items-center justify-center py-[50px] px-[20px] bg-mainBackground`}>
      <LogoPublic />
      {children}
    </div>
  );
}

