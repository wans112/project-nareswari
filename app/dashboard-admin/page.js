"use client";

import { useRouter } from "next/navigation";

import SidebarAndNavbar from "@/components/ui/SidebarAndNavbar";
import StatistikAdmin from "@/components/admin/Statistik";
import ProdukAdmin from "@/components/admin/Produk";
import ManajamenKategoriAndBenefit from "@/components/admin/ManajamenKategoriAndBenefit";
import { BarChart3, MessagesSquare, Package, Settings2, TicketPercent, Calendar, Bell } from "lucide-react";
import Diskon from "@/components/admin/Diskon";
import ReviewAdmin from "@/components/admin/Review";
import NotifikasiNomor from "@/components/admin/NotifikasiNomor";
import Booking from "@/components/admin/Booking";

export default function Page() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
        } catch (error) {
            // ignore errors so user can still navigate away
        } finally {
            router.replace("/admin");
        }
    };

    const menuItems = [
        {
            id: "statistik",
            label: "Statistik",
            icon: BarChart3,
            component: <StatistikAdmin />,
        },
        {
            id: "booking",
            label: "Booking",
            icon: Calendar,
            component: <Booking />,
        },
        {
            id: "produk",
            label: "Produk",
            icon: Package,
            component: <ProdukAdmin />,
        },
        {
            id: "kategoridanbenefit",
            label: "Kategori & Benefit",
            icon: Settings2,
            component: <ManajamenKategoriAndBenefit />,
        },
        {
            id: "diskon",
            label: "Diskon",
            icon: TicketPercent,
            component: <Diskon />,
        },
        {
            id: "review",
            label: "Review",
            icon: MessagesSquare,
            component: <ReviewAdmin />,
        },
        {
            id: "notifikasinomor",
            label: "Notifikasi Nomor",
            icon: Bell,
            component: <NotifikasiNomor />,
        }
    ];

    return (
        <SidebarAndNavbar
            brandName="Nareswari Admin"
            menuItems={menuItems}
            userMenu={{
                name: "Admin",
                username: "admin",
                menu: [],
            }}
            onLogout={handleLogout}
        />
    );
}
