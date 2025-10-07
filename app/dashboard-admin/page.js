"use client";

import SidebarAndNavbar from "@/components/ui/SidebarAndNavbar";
import ProdukAdmin from "@/components/admin/Produk";
import ManajamenKategoriAndBenefit from "@/components/admin/ManajamenKategoriAndBenefit";
import { Package, Settings2, TicketPercent } from "lucide-react";
import Diskon from "@/components/admin/Diskon";

export default function Page() {
    const menuItems = [
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
        }
    ];

    return (
        <SidebarAndNavbar
            brandName="Nareswari Admin"
            menuItems={menuItems}
        />
    );
}
