"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Image, Tag, message, Input } from "antd";
import { EyeOutlined } from "@ant-design/icons";

export default function Booking() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch bookings
  async function fetchBookings() {
    setLoading(true);
    try {
      const res = await fetch("/api/booking");
      if (!res.ok) throw new Error("Gagal memuat data booking");
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  // Filter bookings based on search query
  const filteredBookings = bookings.filter(booking =>
    booking.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.telepon.includes(searchQuery) ||
    (booking.catatan && booking.catatan.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // View image modal
  function handleViewImage(imagePath) {
    setSelectedImage(imagePath);
    setImageModalOpen(true);
  }

  // Table columns
  const columns = [
    {
      title: "Nama",
      dataIndex: "nama",
      key: "nama",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Telepon",
      dataIndex: "telepon",
      key: "telepon",
    },
    {
      title: "Tanggal",
      dataIndex: "tanggal",
      key: "tanggal",
      render: (text) => new Date(text).toLocaleDateString("id-ID"),
      sorter: (a, b) => new Date(a.tanggal) - new Date(b.tanggal),
    },
    {
      title: "Catatan",
      dataIndex: "catatan",
      key: "catatan",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Pending", value: "pending" },
        { text: "Menunggu Konfirmasi", value: "menunggu konfirmasi" },
        { text: "Dikonfirmasi", value: "dikonfirmasi" },
        { text: "Ditolak", value: "ditolak" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        let color = "default";
        if (status === "menunggu konfirmasi") color = "orange";
        else if (status === "dikonfirmasi") color = "green";
        else if (status === "ditolak") color = "red";
        return <Tag color={color}>{status || "pending"}</Tag>;
      },
    },
    {
      title: "Bukti Transfer",
      dataIndex: "image_path",
      key: "image_path",
      render: (imagePath) =>
        imagePath ? (
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewImage(`/api/bukti-transfer/${imagePath.split('/')[1]}`)}
          >
            Lihat
          </Button>
        ) : (
          "Tidak ada"
        ),
    },
  ];

  return (
    <div>
      <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 16 }}>Data Booking</h2>
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Cari nama, email, telepon, atau catatan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: 300 }}
        />
      </div>
      <Table
        columns={columns}
        dataSource={filteredBookings}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />
      <Modal
        open={imageModalOpen}
        onCancel={() => {
          setImageModalOpen(false);
          setSelectedImage(null);
        }}
        footer={null}
        title="Bukti Transfer"
        width={600}
      >
        {selectedImage && <Image src={selectedImage} alt="Bukti Transfer" />}
      </Modal>
    </div>
  );
}
