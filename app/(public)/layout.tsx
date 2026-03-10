import { LogoPublic } from "@/lib/svg";
import GlobalGuard from "../GlobalGuard";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <GlobalGuard>
            <div className="min-h-screen flex flex-col gap-[30px] items-center py-[50px] px-[20px] bg-mainBackground">
                <LogoPublic />
                {children}

            </div>
        </GlobalGuard>
    );
}
