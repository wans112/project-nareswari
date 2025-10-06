
/** ---
SidebarAndNavbar
Komponen layout utama untuk aplikasi dashboard berbasis Next.js dan TailwindCSS.

Fitur:
- Navbar dengan branding/logo yang dapat diubah melalui prop.
- Sidebar dinamis berdasarkan array menuItems (setiap item bisa punya icon dan komponen konten sendiri).
- Konten utama otomatis berubah sesuai menu sidebar yang dipilih.
- User menu dropdown di navbar yang dapat di-edit dari halaman melalui prop userMenu (bisa di-hide jika tidak diisi).
- Responsif: sidebar bisa dibuka/tutup di mobile, navbar tetap di atas.
- Dukungan icon lucide-react untuk sidebar dan user menu.
- Warna biru utama: #1677ff, border transparan, tampilan modern.

Penggunaan:
- Import komponen dan icon lucide-react sesuai kebutuhan.
- menuItems adalah array berisi id, label, icon, dan komponen konten.
- userMenu adalah object berisi username, avatar (opsional), dan array menu dropdown (label, href/onClick, icon).
- brandName dan brandLogo untuk branding di navbar.
- Jika userMenu tidak diisi, dropdown user tidak akan tampil.
- children akan dirender jika menuItems kosong.

Props:
- menuItems: Array of object
  id: string, unik untuk setiap menu
  label: string, nama menu yang tampil di sidebar
  icon: Komponen icon (misal dari lucide-react)
  component: ReactNode, komponen yang dirender di konten utama saat menu aktif
- brandName: string | ReactNode, nama branding di navbar
- brandLogo: string | ReactNode, logo branding di navbar (bisa string, img, atau komponen)
- userMenu: object (opsional)
  name: string, nama user yang tampil di dropdown
  username: string, nama user yang tampil di dropdown
  avatar: ReactNode, avatar user (opsional) (bisa string, img, atau komponen)
  menu: Array of object
    label: ReactNode, isi menu dropdown (bisa string, icon + string, atau komponen lain)
    href: string, link tujuan (opsional)
    onClick: function, handler klik (opsional)
  Jika userMenu tidak diisi, dropdown user tidak akan tampil.
- children: Konten fallback jika menuItems kosong.
---**/
'use client'


import { useState } from 'react'
import Link from 'next/link'
import { MenuOutlined, CloseOutlined } from '@ant-design/icons'
import { Dropdown, Space } from 'antd'

// ...dokumentasi lengkap di atas...
// userMenu: { name: string, username: string, avatar: ReactNode, menu: Array }
export default function SidebarAndNavbar({ menuItems = [], children, brandName = "", brandLogo = "", userMenu = null }) {
  // State untuk sidebar mobile
  const [sidebarOpen, setSidebarOpen] = useState(false)
    // State menu aktif di sidebar
  const [activeMenu, setActiveMenu] = useState(menuItems[0]?.id || null)

  // Struktur utama layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar: branding dan user menu */}
        <nav className="fixed top-0 z-50 w-full bg-white border-b" style={{ borderColor: 'rgba(22, 119, 255, 0.25)' }}>
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start rtl:justify-end">
              {/* Tombol sidebar untuk mobile */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                type="button"
                className="inline-flex items-center p-2 text-sm rounded-lg sm:hidden hover:bg-[#e6f4ff] focus:outline-none focus:ring-2"
                style={{ color: '#1677ff', boxShadow: 'none', border: 'none' }}
              >
                <span className="sr-only">Open sidebar</span>
                {sidebarOpen ? (
                  <CloseOutlined />
                ) : (
                  <MenuOutlined />
                )}
              </button>
              {/* Branding logo dan judul, bisa diubah lewat props */}
              <div className="flex ms-2 md:me-24">
                {/* Logo: jika kosong, tidak tampil */}
                {brandLogo && (
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center me-3" style={{ backgroundColor: '#1677ff' }}>
                    {typeof brandLogo === 'string' ? (
                      <span className="text-white font-bold text-lg">{brandLogo}</span>
                    ) : brandLogo}
                  </div>
                )}
                {/* BrandName: jika kosong, tidak tampil */}
                {brandName && (
                  <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap" style={{ color: '#1677ff' }}>
                    {brandName}
                  </span>
                )}
              </div>
            </div>
            {/* User menu dropdown, tampil hanya jika userMenu ada, menggunakan Ant Design Dropdown */}
            {userMenu && (
              <div className="flex items-center">
                <div className="flex items-center ms-3">
                  {/* Build Ant Design menu items from userMenu */}
                  {(() => {
                    const items = [];
                    // Nama dan username di atas menu
                    items.push({
                      key: 'user-info',
                      label: (
                        <div style={{ lineHeight: 1.2 }}>
                          <span style={{ fontWeight: 600, color: '#1677ff' }}>{userMenu.name || userMenu.username || 'User'}</span>
                          {userMenu.username && (
                            <div style={{ fontSize: 12, color: '#888' }}>{userMenu.username}</div>
                          )}
                        </div>
                      ),
                      disabled: true,
                    });
                    items.push({ type: 'divider' });
                    // Menu items dari userMenu.menu
                    userMenu.menu?.forEach((item, idx) => {
                      items.push({
                        key: item.key || idx,
                          label: (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={item.onClick}>
                              {item.label}
                            </span>
                          ),
                      });
                    });
                    return (
                      <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
                        <a onClick={e => e.preventDefault()} style={{ cursor: 'pointer' }}>
                          <Space>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1677ff' }}>
                              {userMenu.avatar ? (
                                userMenu.avatar
                              ) : (
                                <span className="text-white text-sm font-medium">{userMenu.name?.[0]?.toUpperCase() || userMenu.username?.[0]?.toUpperCase() || 'U'}</span>
                              )}
                            </div>
                          </Space>
                        </a>
                      </Dropdown>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

  {/* Sidebar dinamis berdasarkan menuItems */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform bg-white border-r border-blue-100 shadow-sm ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } sm:translate-x-0`}
        aria-label="Sidebar"
      >
        <div className="h-full px-3 pb-4 overflow-y-auto bg-white">
          <ul className="space-y-2 font-medium">
            {/* Loop menuItems untuk sidebar */}
            {menuItems.map((item) => {
              const isActive = activeMenu === item.id
              const Icon = item.icon
              return (
                <li key={item.id}>
                  {/* Tombol menu sidebar */}
                  <button
                    className={`flex items-center w-full p-2 rounded-lg group transition-colors text-left ${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-900'
                    }`}
                    onClick={() => {
                      setActiveMenu(item.id);
                      if (typeof window !== 'undefined' && window.innerWidth < 640) setSidebarOpen(false);
                    }}
                  >
                    {/* Icon menu jika ada */}
                    {Icon && (
                      <Icon />
                    )}
                    <span className="ms-3">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </aside>

      {/* Main Content: render komponen menu aktif atau children */}
      <div className="p-4 sm:ml-64">
        <div className="p-4 mt-14">
          {/* Jika menuItems ada, render komponen menu aktif, jika tidak render children */}
          {menuItems.length > 0
            ? menuItems.find((item) => item.id === activeMenu)?.component
            : children}
        </div>
      </div>

      {/* Overlay untuk sidebar di mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900 bg-opacity-50 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  )
}