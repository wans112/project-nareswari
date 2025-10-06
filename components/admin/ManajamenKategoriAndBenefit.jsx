"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm, Tag } from "antd";

export default function ManajamenKategoriAndBenefit() {
  // State
  const [kategori, setKategori] = useState([]);
  const [benefit, setBenefit] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("kategori"); // "kategori" or "benefit"
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  // Fetch data
  async function fetchAll() {
    setLoading(true);
    try {
      const [katRes, benRes] = await Promise.all([
        fetch("/api/kategori-produk"),
        fetch("/api/benefit"),
      ]);
      setKategori(await katRes.json());
      setBenefit(await benRes.json());
    } catch (e) {
      message.error("Gagal memuat data kategori/benefit");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  // Open modal for add/edit
  function openModal(type, record = null) {
    setModalType(type);
    setEditing(record);
    form.resetFields();
    if (record) {
      if (type === "kategori") {
        form.setFieldsValue({ nama_kategori: record.nama_kategori, sub_kategori: record.sub_kategori });
      } else {
        form.setFieldsValue({ benefit: record.benefit, kategori_benefit_id: record.kategori_benefit_id });
      }
    }
    setModalOpen(true);
  }

  // Submit modal
  async function handleModalSubmit() {
    try {
      const vals = await form.validateFields();
      if (modalType === "kategori") {
        if (editing) {
          await fetch(`/api/kategori-produk?id=${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(vals),
          });
        } else {
          await fetch("/api/kategori-produk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(vals),
          });
        }
      } else {
        if (editing) {
          await fetch(`/api/benefit?id=${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(vals),
          });
        } else {
          await fetch("/api/benefit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(vals),
          });
        }
      }
      setModalOpen(false);
      setEditing(null);
      await fetchAll();
      message.success("Berhasil disimpan");
    } catch (e) {
      message.error("Gagal menyimpan");
    }
  }

  // Delete
  async function handleDelete(type, id) {
    try {
      await fetch(`/api/${type === "kategori" ? "kategori-produk" : "benefit"}?id=${id}`, { method: "DELETE" });
      await fetchAll();
      message.success("Berhasil dihapus");
    } catch (e) {
      message.error("Gagal menghapus");
    }
  }

  // Table columns
  const kategoriColumns = [
    { title: "Nama Kategori", dataIndex: "nama_kategori", key: "nama_kategori" },
    { title: "Sub Kategori", dataIndex: "sub_kategori", key: "sub_kategori" },
    { title: "Aksi", key: "aksi", render: (_, r) => (
      <Space>
        <Button size="small" onClick={() => openModal("kategori", r)}>Edit</Button>
        <Popconfirm title="Hapus kategori?" onConfirm={() => handleDelete("kategori", r.id)}>
          <Button size="small" danger>Hapus</Button>
        </Popconfirm>
      </Space>
    ) },
  ];

  const benefitColumns = [
    { title: "Benefit", dataIndex: "benefit", key: "benefit" },
    { title: "Kategori Benefit", dataIndex: "nama_kategori", key: "nama_kategori", render: (v) => v ? <Tag>{v}</Tag> : "-" },
    { title: "Aksi", key: "aksi", render: (_, r) => (
      <Space>
        <Button size="small" onClick={() => openModal("benefit", r)}>Edit</Button>
        <Popconfirm title="Hapus benefit?" onConfirm={() => handleDelete("benefit", r.id)}>
          <Button size="small" danger>Hapus</Button>
        </Popconfirm>
      </Space>
    ) },
  ];

  return (
    <div>
      <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 16 }}>Manajemen Kategori & Benefit</h2>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => openModal("kategori")}>Tambah Kategori</Button>
        <Button type="primary" onClick={() => openModal("benefit")}>Tambah Benefit</Button>
      </Space>
      <Table
        columns={kategoriColumns}
        dataSource={kategori}
        rowKey="id"
        loading={loading}
        pagination={false}
        title={() => <span style={{ fontWeight: 500 }}>Daftar Kategori Produk</span>}
        style={{ marginBottom: 32 }}
      />
      <Table
        columns={benefitColumns}
        dataSource={benefit}
        rowKey="id"
        loading={loading}
        pagination={false}
        title={() => <span style={{ fontWeight: 500 }}>Daftar Benefit</span>}
      />
      <Modal
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        onOk={handleModalSubmit}
        title={modalType === "kategori" ? (editing ? "Edit Kategori" : "Tambah Kategori") : (editing ? "Edit Benefit" : "Tambah Benefit")}
        okText="Simpan"
        cancelText="Batal"
        destroyOnHidden={false}
      >
        <Form form={form} layout="vertical">
          {modalType === "kategori" ? (
            <>
              <Form.Item name="nama_kategori" label="Nama Kategori" rules={[{ required: true, message: "Wajib diisi" }]}> <Input /> </Form.Item>
              <Form.Item name="sub_kategori" label="Sub Kategori"> <Input /> </Form.Item>
            </>
          ) : (
            <>
              <Form.Item name="benefit" label="Nama Benefit" rules={[{ required: true, message: "Wajib diisi" }]}> <Input /> </Form.Item>
              <Form.Item name="kategori_benefit_id" label="Kategori Benefit">
                <Input />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
