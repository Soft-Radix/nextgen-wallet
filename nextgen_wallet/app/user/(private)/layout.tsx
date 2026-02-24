import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PrivateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/user/welcome");
    }

    return (
        <div className="min-h-screen relative">
            {/* Main Content */}
            <main className="flex-1 p-6 bg-mainBackground h-[calc(100vh-100px)]">{children}</main>
            {/* Sidebar */}
            <div className="w-full h-[100px] bg-[#ffffff] text-white p-4 fixed bottom-0 left-0 right-0 border-t border-[#E2E8F0] ">
                Dashboard Menu
            </div>
        </div>
    );
}
