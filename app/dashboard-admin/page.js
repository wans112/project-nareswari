"use client";

import SidebarAndNavbar from "@/components/ui/SidebarAndNavbar";
import ProdukAdmin from "@/components/admin/Produk";
import ManajamenKategoriAndBenefit from "@/components/admin/ManajamenKategoriAndBenefit";
import { Package } from "lucide-react";

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
            icon: Package,
            component: <ManajamenKategoriAndBenefit />,
        }
    ];

    return (
        <SidebarAndNavbar
            brandName="Nareswari Admin"
            menuItems={menuItems}
        />
    );
}
