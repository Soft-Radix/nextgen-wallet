"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        try {
            const stored = typeof window !== "undefined"
                ? window.localStorage.getItem("user")
                : null;
            const parsed = stored ? JSON.parse(stored) : null;

            if (!parsed || Object.keys(parsed).length === 0) {
                router.replace("/user/welcome");
                return;
            }

            setUser(parsed);
            setIsReady(true);
        } catch {
            router.replace("/user/welcome");
        }
    }, [router]);

    if (!isReady) {
        return null; // or a loading skeleton
    }

    return (
        <div>
            <div className="w-[50px] h-[50px] rounded-full bg-gray-200">
                {/* You can render user info here */}
            </div>
        </div>
    );
}
