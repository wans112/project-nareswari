"use client";

import SidebarAndNavbar from "@/components/ui/SidebarAndNavbar";
import StatistikAdmin from "@/components/admin/Statistik";
import ProdukAdmin from "@/components/admin/Produk";
import ManajamenKategoriAndBenefit from "@/components/admin/ManajamenKategoriAndBenefit";
import { BarChart3, MessagesSquare, Package, Settings2, TicketPercent } from "lucide-react";
import Diskon from "@/components/admin/Diskon";
import ReviewAdmin from "@/components/admin/Review";
import NotifikasiNomor from "@/components/admin/NotifikasiNomor";

export default function Page() {
    const menuItems = [
        {
            id: "statistik",
            label: "Statistik",
            icon: BarChart3,
            component: <StatistikAdmin />,
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
            icon: MessagesSquare,
            component: <NotifikasiNomor />,
        }
    ];

    return (
        <SidebarAndNavbar
            brandName="Nareswari Admin"
            menuItems={menuItems}
        />
    );
}
