"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined } from "@ant-design/icons";

export default function ManajamenKategoriAndBenefit() {
  // State
  const [kategori, setKategori] = useState([]);
  const [benefit, setBenefit] = useState([]);
  const [kategoriBenefit, setKategoriBenefit] = useState([]);
  const [kategoriBenefitCreateModalOpen, setKategoriBenefitCreateModalOpen] = useState(false);
  const [formKb] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("kategori"); // "kategori" or "benefit"
  const [editing, setEditing] = useState(null);
  const [kategoriBenefitModalOpen, setKategoriBenefitModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Fetch data
  async function fetchAll() {
    setLoading(true);
    try {
      const [katRes, benRes, katBenRes] = await Promise.all([
        fetch("/api/kategori-produk"),
        fetch("/api/benefit"),
        fetch("/api/benefit/kategori"),
      ]);
      setKategori(await katRes.json());
      setBenefit(await benRes.json());
      // kategori benefit endpoint returns list of benefit categories
      setKategoriBenefit(await katBenRes.json());
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
        if (type === 'benefit') {
          form.setFieldsValue({ benefit: record.benefit, kategori_benefit_id: record.kategori_benefit_id });
        } else if (type === 'kategori_benefit') {
          form.setFieldsValue({ nama_kategori: record.nama_kategori });
        }
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
      if (modalType === 'kategori_benefit') {
        if (editing) {
          await fetch(`/api/benefit/kategori?id=${editing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vals),
          });
        } else {
          await fetch('/api/benefit/kategori', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
      if (type === 'kategori') {
        await fetch(`/api/kategori-produk?id=${id}`, { method: 'DELETE' });
      } else if (type === 'benefit') {
        await fetch(`/api/benefit?id=${id}`, { method: 'DELETE' });
      } else if (type === 'kategori_benefit') {
        await fetch(`/api/benefit/kategori?id=${id}`, { method: 'DELETE' });
      }
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
        <Button size="small" icon={<EditOutlined />} onClick={() => openModal("kategori", r)}>Edit</Button>
        <Popconfirm title="Hapus kategori?" onConfirm={() => handleDelete("kategori", r.id)}>
          <Button size="small" danger icon={<DeleteOutlined />}>Hapus</Button>
        </Popconfirm>
      </Space>
    ) },
  ];

  const benefitColumns = [
    { title: "Benefit", dataIndex: "benefit", key: "benefit" },
    { title: "Kategori Benefit", dataIndex: "nama_kategori", key: "nama_kategori", render: (v) => v ? <Tag>{v}</Tag> : "-" },
    { title: "Aksi", key: "aksi", render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => openModal("benefit", r)}>Edit</Button>
        <Popconfirm title="Hapus benefit?" onConfirm={() => handleDelete("benefit", r.id)}>
          <Button size="small" danger icon={<DeleteOutlined />}>Hapus</Button>
        </Popconfirm>
      </Space>
    ) },
  ];

  const kategoriBenefitColumns = [
    { title: 'Nama Kategori', dataIndex: 'nama_kategori', key: 'nama_kategori' },
    { title: 'Jumlah Benefit', dataIndex: 'jumlah_benefit', key: 'jumlah_benefit' },
    { title: 'Aksi', key: 'aksi', render: (_, r) => (
      <Space>
        <Popconfirm title="Hapus kategori benefit?" onConfirm={() => handleDelete('kategori_benefit', r.id)}>
          <Button size="small" danger icon={<DeleteOutlined />}>Hapus</Button>
        </Popconfirm>
      </Space>
    ) }
  ];

  return (
    <div>
      <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 16 }}>Manajemen Kategori</h2>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal("kategori")}>Tambah Kategori</Button>
      </Space>
      <Table
        columns={kategoriColumns}
        dataSource={kategori}
        rowKey="id"
        loading={loading}
        pagination={false}
        style={{ marginBottom: 32 }}
      />

      <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 16 }}>Manajemen Benefit</h2>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal("benefit")}>Tambah Benefit</Button>
        <Button icon={<AppstoreOutlined />} onClick={() => setKategoriBenefitModalOpen(true)}>Kelola Kategori Benefit</Button>
      </Space>
      <Table
        columns={benefitColumns}
        dataSource={benefit}
        rowKey="id"
        loading={loading}
        pagination={false}
      />
      <Modal
        open={kategoriBenefitModalOpen}
        onCancel={() => setKategoriBenefitModalOpen(false)}
        footer={null}
        title="Kelola Kategori Benefit"
      >
        <Space style={{ marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setKategoriBenefitCreateModalOpen(true)}>Tambah Kategori</Button>
        </Space>
        <Table
          columns={kategoriBenefitColumns}
          dataSource={kategoriBenefit}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Modal>

      {/* Create-only modal for kategori_benefit */}
      <Modal
        open={kategoriBenefitCreateModalOpen}
        onCancel={() => { setKategoriBenefitCreateModalOpen(false); formKb.resetFields(); }}
        onOk={async () => {
          try {
            const vals = await formKb.validateFields();
            await fetch('/api/benefit/kategori', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(vals),
            });
            setKategoriBenefitCreateModalOpen(false);
            formKb.resetFields();
            await fetchAll();
            message.success('Berhasil menambah kategori benefit');
          } catch (err) {
            message.error('Gagal menambah kategori benefit');
          }
        }}
        title="Tambah Kategori Benefit"
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={formKb} layout="vertical">
          <Form.Item name="nama_kategori" label="Nama Kategori" rules={[{ required: true, message: 'Wajib diisi' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
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
