"use client";

import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm, Select, InputNumber, DatePicker, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
dayjs.extend(localizedFormat);

export default function Diskon() {
  const [diskon, setDiskon] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [products, setProducts] = useState([]);

  function formatRupiah(value) {
    if (value == null || value === '') return '-';
    const n = Number(value);
    if (isNaN(n)) return value;
    return n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
  }

  async function fetchAll() {
    setLoading(true);
    try {
      // request include_all so admin always sees inactive discounts too
      const [dRes, pRes] = await Promise.all([fetch('/api/diskon?include_all=1'), fetch('/api/produk?meta=1')]);
      setDiskon(await dRes.json());
      const meta = await pRes.json();
      // /api/produk?meta=1 returns { categories, benefits } in your code; but we need products list
      // fallback: fetch products list separately
      if (Array.isArray(meta.categories)) {
        // meta object not containing products; fetch products
        const pr = await fetch('/api/produk');
        setProducts(await pr.json());
      } else if (Array.isArray(meta)) {
        setProducts(meta);
      } else {
        setProducts([]);
      }
    } catch (err) {
      message.error('Gagal memuat data diskon');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  function openModal(record = null) {
    setEditing(record);
    form.resetFields();
    if (record) {
      form.setFieldsValue({
        nama_diskon: record.nama_diskon,
        produk_id: record.produk_id,
        type: record.persentase != null ? 'persentase' : (record.nominal != null ? 'nominal' : 'persentase'),
        persentase: record.persentase,
        nominal: record.nominal,
        deskripsi: record.deskripsi,
        mulai: record.mulai ? dayjs(record.mulai) : null,
        berakhir: record.berakhir ? dayjs(record.berakhir) : null,
      });
    }
    setModalOpen(true);
  }

  async function handleSubmit() {
    try {
      const vals = await form.validateFields();
      const payload = { ...vals };
      // convert dayjs to ISO if present
  if (payload.mulai && payload.mulai.toISOString) payload.mulai = payload.mulai.toISOString();
  if (payload.berakhir && payload.berakhir.toISOString) payload.berakhir = payload.berakhir.toISOString();

      if (editing) {
        await fetch(`/api/diskon?id=${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch('/api/diskon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      setModalOpen(false);
      setEditing(null);
      await fetchAll();
      message.success('Berhasil disimpan');
    } catch (err) {
      message.error('Gagal menyimpan');
    }
  }

  async function handleDelete(id) {
    try {
      await fetch(`/api/diskon?id=${id}`, { method: 'DELETE' });
      message.success('Berhasil dihapus');
      await fetchAll();
    } catch (err) {
      message.error('Gagal menghapus');
    }
  }

  function computePriceAfter(prod, d) {
    if (!prod || prod.harga == null) return null;
    const harga = Number(prod.harga || 0);
    if (d.persentase != null) return Math.round(harga - (harga * Number(d.persentase) / 100));
    if (d.nominal != null) return Math.round(harga - Number(d.nominal));
    return harga;
  }

  const columns = [
  { title: 'Status', key: 'status', render: (_, r) => r.aktif === 1 ? <Tag color="#2ecc71">Aktif</Tag> : <Tag color="red">Nonaktif</Tag> },
    { title: 'Nama Diskon', dataIndex: 'nama_diskon', key: 'nama_diskon' },
    { title: 'Nama Produk', dataIndex: 'produk_id', key: 'produk_id', render: (v) => {
      const p = products.find(x => x.id === v);
      return p ? p.nama_paket : v;
    }},
    { title: 'Diskon', key: 'tipe', render: (_, r) => r.persentase != null ? `${r.persentase}%` : (r.nominal != null ? formatRupiah(r.nominal) : '-') },
    { title: 'Harga', key: 'harga', render: (_, r) => {
      const p = products.find(x => x.id === r.produk_id);
      const before = p && p.harga != null ? formatRupiah(p.harga) : null;
      const pa = computePriceAfter(p, r);
      const after = pa != null ? formatRupiah(pa) : null;
      return (
        <div>
          <div style={{ fontSize: 12, textDecoration: before ? 'line-through' : 'none', color: '#666' }}>{before || '-'}</div>
          <div style={{ color: '#24c53aff', fontWeight: 600 }}>{after || '-'}</div>
        </div>
      );
    }},
    { title: 'Aksi', key: 'aksi', render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)}>Edit</Button>
        <Popconfirm title="Hapus diskon?" onConfirm={() => handleDelete(r.id)}>
          <Button size="small" danger icon={<DeleteOutlined />}>Hapus</Button>
        </Popconfirm>
      </Space>
    )}
  ];

  return (
    <div>
      <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 16 }}>Manajemen Diskon</h2>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null)}>Tambah Diskon</Button>
      </Space>
      <Table columns={columns} dataSource={diskon} rowKey="id" loading={loading} pagination={false} />

      <Modal open={modalOpen} onCancel={() => { setModalOpen(false); setEditing(null); }} onOk={handleSubmit} title={editing ? 'Edit Diskon' : 'Tambah Diskon'}>
        <Form form={form} layout="vertical">
          <Form.Item name="nama_diskon" label="Nama Diskon" rules={[{ required: true, message: 'Wajib diisi' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="produk_id" label="Produk" rules={[{ required: true, message: 'Pilih produk' }]}>
            <Select showSearch options={products.map(p => ({ label: p.nama_paket, value: p.id }))} />
          </Form.Item>
          <Form.Item name="type" label="Tipe Diskon" initialValue="persentase">
            <Select options={[{ label: 'Persentase', value: 'persentase' }, { label: 'Nominal', value: 'nominal' }]} />
          </Form.Item>
          {/* show only relevant input based on type */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
            {() => (
              form.getFieldValue('type') === 'persentase' ? (
                <Form.Item name="persentase" label="Persentase (%)" rules={[{ required: true, message: 'Isi persentase' }]}>
                  <InputNumber min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>
              ) : (
                <Form.Item name="nominal" label="Nominal (Rp)" rules={[{ required: true, message: 'Isi nominal' }]}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              )
            )}
          </Form.Item>
          <Form.Item name="mulai" label="Mulai">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="berakhir" label="Berakhir">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="deskripsi" label="Deskripsi">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
