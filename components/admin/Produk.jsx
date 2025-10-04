"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Tag, message, Upload, List, Image, Popconfirm } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

export default function ProdukAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [meta, setMeta] = useState({ categories: [], benefits: [] });
  // benefit UI: simple select populated from meta.benefits
  
  const [modalMedia, setModalMedia] = useState([]); // media attached in product modal (objects {id, url, media_path})
  const [benefitOpen, setBenefitOpen] = useState(false);
  const [benefitName, setBenefitName] = useState('');
  const [benefitQuery, setBenefitQuery] = useState('');
  const [benefitKategori, setBenefitKategori] = useState('');
  const [addingBenefit, setAddingBenefit] = useState(false);
  const [benefitCategories, setBenefitCategories] = useState([]);
  const [editingBenefit, setEditingBenefit] = useState(null);
  const [editBenefitName, setEditBenefitName] = useState('');
  const [editBenefitKategori, setEditBenefitKategori] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const benefitOptions = useMemo(() => meta.benefits.map(b => ({ label: b.benefit, value: b.id })), [meta]);
  const categoryOptions = useMemo(() => meta.categories.map(c => ({ label: `${c.nama_kategori}${c.sub_kategori ? ` — ${c.sub_kategori}` : ''}` , value: c.id })), [meta]);
  const filteredBenefitOptions = benefitOptions;
  const benefitKategoriOptions = useMemo(() => {
    const fromApi = (benefitCategories || [])
      .map(k => ({ label: k.nama_kategori, value: k.nama_kategori }))
      .filter(opt => !!opt.value);
    if (fromApi.length > 0) return fromApi;
    // fallback to dedupe from meta.benefits if categories API empty
    const s = new Set();
    (meta.benefits || []).forEach(b => {
      if (b && (b.nama_kategori || b.kategori)) s.add(b.nama_kategori || b.kategori);
    });
    return Array.from(s).filter(Boolean).map(k => ({ label: k, value: k }));
  }, [benefitCategories, meta]);

  async function fetchMeta() {
    try {
      // fetch categories (produk), full benefits (with kategori), and kategori_benefit list
      const [prodRes, benRes, catBenRes] = await Promise.all([
        fetch('/api/produk?meta=1', { cache: 'no-store' }),
        fetch('/api/benefit', { cache: 'no-store' }),
        fetch('/api/benefit/kategori', { cache: 'no-store' })
      ]);
      const prodMeta = await prodRes.json();
      let benefits = [];
      try { benefits = await benRes.json(); } catch (_) { benefits = prodMeta?.benefits || []; }
      try {
        const catRows = await catBenRes.json();
        setBenefitCategories(Array.isArray(catRows) ? catRows : []);
      } catch (_) { setBenefitCategories([]); }
      setMeta({
        categories: prodMeta?.categories || [],
        benefits: Array.isArray(benefits) ? benefits : (prodMeta?.benefits || [])
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchRows() {
    setLoading(true);
    try {
      const res = await fetch('/api/produk');
      const j = await res.json();
      setRows(j || []);
    } catch (e) {
      message.error('Gagal memuat data');
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchMeta(); fetchRows(); }, []);

  // no manage modal: benefits loaded via fetchMeta()

  function openCreate() {
    setEditing(null);
    form.resetFields();
  setModalMedia([]);
  setOpen(true);
  }

  // benefit creation removed; select is read-only list from meta

  function openEdit(record) {
    setEditing(record);
    form.setFieldsValue({
      nama_paket: record.nama_paket,
      harga: record.harga || null,
      kategori_produk_id: record.kategori_produk_id,
      benefits: [] // will map names to IDs below
    });
    // Convert benefit names into IDs (best-effort)
    // Normalize benefits to primitive IDs or strings to avoid passing objects (which can cause circular references)
    const ids = (record.benefits || []).map(name => {
      const found = meta.benefits.find(b => b.benefit === name || b.id === name || String(b.id) === String(name));
      if (found && (typeof found.id === 'number' || typeof found.id === 'string')) return found.id;
      // if name is already a primitive (string/number), keep it
      return (typeof name === 'string' || typeof name === 'number') ? name : (name?.id ?? JSON.stringify(name));
    }).filter(Boolean);
    form.setFieldValue('benefits', ids);
    // load current media for this product into modalMedia
    (async () => {
      try {
        const res = await fetch(`/api/media?produk_id=${record.id}`);
        const j = await res.json();
  setModalMedia(j || []);
      } catch (e) { console.error(e); }
    })();
    setOpen(true);
  }

  async function handleOk() {
    try {
      const vals = await form.validateFields();
      // if there are temporary files in modalMedia (temp === true), upload them first
      const tempFiles = modalMedia.filter(m => m.temp === true);
      const uploadedIds = [];
      for (const t of tempFiles) {
        const fd = new FormData();
        fd.append('file', t.file);
        const res = await fetch('/api/media', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Gagal mengunggah salah satu gambar');
        const j = await res.json();
        uploadedIds.push(j.id);
      }

      // collect all media ids: existing ones (have id) + newly uploaded
      const existingIds = modalMedia.filter(m => !m.temp).map(m => m.id);
      const allMediaIds = [...existingIds, ...uploadedIds];

      const payload = {
        nama_paket: vals.nama_paket,
        harga: vals.harga ?? null,
        kategori_produk_id: vals.kategori_produk_id ?? undefined,
        benefits: vals.benefits || [],
        media_ids: allMediaIds
      };
      if (editing) {
        await fetch(`/api/produk?id=${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch('/api/produk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      setOpen(false);
      await fetchRows();
      await fetchMeta();
    } catch (e) {
      // validation errors will be thrown by antd; network we show
      if (e?.message) message.error(e.message);
    }
  }

  async function handleDelete(id) {
    try {
      await fetch(`/api/produk?id=${id}`, { method: 'DELETE' });
      await fetchRows();
    } catch (e) { message.error('Gagal menghapus'); }
  }

  // upload file directly into product modal (temporary association with produk_id=null)
  async function handleModalUpload({ file }) {
    // validate file is an image
    function isImage(f) {
      if (!f) return false;
      if (f.type) return f.type.startsWith('image/');
      const n = (f.name || '').toLowerCase();
      const ext = n.split('.').pop();
      return ['jpg','jpeg','png','gif','webp'].includes(ext);
    }

    if (!isImage(file)) {
      return message.error('Hanya file gambar yang diperbolehkan');
    }

    // make upload temporary: store File and a local preview, upload later when user clicks Save
    try {
      const preview = URL.createObjectURL(file);
      const tmp = { temp: true, file, preview, media_path: file.name };
      setModalMedia(prev => [...prev, tmp]);
    } catch (e) {
      message.error('Gagal menyiapkan file');
    }
  }

  async function handleDeleteMedia(id) {
    try {
      await fetch(`/api/media?id=${id}`, { method: 'DELETE' });
      // media modal removed; no local refresh here
    } catch (e) { message.error('Gagal menghapus media'); }
  }

  async function handleAddBenefit() {
    if (!benefitName || !benefitName.trim()) return message.error('Nama benefit wajib diisi');
    setAddingBenefit(true);
    try {
      const payload = { benefit: benefitName.trim() };
      if (benefitKategori && benefitKategori.trim()) payload.nama_kategori = benefitKategori.trim();
      const res = await fetch('/api/benefit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Gagal menambah benefit');
      }
      await res.json();
      message.success('Benefit ditambahkan');
      setBenefitName('');
      setBenefitKategori('');
      await fetchMeta();
    } catch (e) {
      message.error(e?.message || 'Gagal menambah benefit');
    } finally {
      setAddingBenefit(false);
    }
  }

  // manage/delete benefit removed

  const columns = [
    { title: 'Nama Paket', dataIndex: 'nama_paket', key: 'nama_paket' },
    { title: 'Harga', dataIndex: 'harga', key: 'harga', render: (v) => v ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(v) : '-' },
    { title: 'Kategori', key: 'kategori', render: (_, r) => `${r.nama_kategori || ''}${r.sub_kategori ? ` — ${r.sub_kategori}` : ''}` },
    { title: 'Benefits', dataIndex: 'benefits', key: 'benefits', render: (b) => (b || []).map(x => <Tag key={x}>{x}</Tag>) },
    { title: 'Aksi', key: 'aksi', render: (_, r) => (
      <Space>
        <Button onClick={() => openEdit(r)}>Edit</Button>
        <Button danger onClick={() => handleDelete(r.id)}>Hapus</Button>
      </Space>
    ) }
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={openCreate}>Tambah Produk</Button>
        <Button onClick={fetchRows}>Refresh</Button>
        <Button onClick={() => { fetchMeta(); setBenefitOpen(true); }}>Kelola Benefit</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} />

      <Modal title={editing ? 'Edit Produk' : 'Tambah Produk'} open={open} onOk={handleOk} onCancel={() => setOpen(false)} okText="Simpan" cancelText="Batal">
        <Form form={form} layout="vertical">
          <Form.Item name="nama_paket" label="Nama Paket" rules={[{ required: true, message: 'Nama paket wajib diisi' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="harga" label="Harga">
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => value ? `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
              parser={value => String(value).replace(/\D+/g, '')}
            />
          </Form.Item>
          <Form.Item name="kategori_produk_id" label="Kategori" rules={[{ required: true, message: 'Pilih kategori' }]}>
            <Select showSearch options={categoryOptions} placeholder="Pilih kategori" />
          </Form.Item>
          <Form.Item name="benefits" label="Benefits" tooltip="Pilih banyak benefit">
            <Select
              mode="multiple"
              options={benefitOptions}
              placeholder="Pilih benefits"
            />
          </Form.Item>

          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>Gambar Produk</div>
              <Upload
                multiple
                accept="image/*"
                customRequest={({ file, onSuccess, onError }) => {
                  handleModalUpload({ file }).then(() => onSuccess && onSuccess('ok')).catch(onError);
                }}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />}>Upload Image</Button>
              </Upload>
            </div>
            <List
              dataSource={modalMedia}
              bordered
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button key="remove" danger size="small" onClick={async () => {
                      // delete media row + file on server, then remove from modal list
                      try {
                        await handleDeleteMedia(item.id);
                        setModalMedia(prev => prev.filter(x => x.id !== item.id));
                        message.success('Gambar dihapus');
                      } catch (err) {
                        message.error('Gagal menghapus gambar');
                      }
                    }}>Hapus</Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Image width={56} src={item.preview || item.url} />}
                    title={item.media_path || item.url}
                  />
                </List.Item>
              )}
            />
          </div>
        </Form>
      </Modal>

      <Modal
        title="Kelola Benefit"
        open={benefitOpen}
        onCancel={() => setBenefitOpen(false)}
        footer={[<Button key="close" onClick={() => setBenefitOpen(false)}>Tutup</Button>]}
        width={900}
        styles={{ body: { maxHeight: '60vh', overflowY: 'auto', paddingBottom: 0 } }}
      >
        <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input
            placeholder="Ketik untuk cari atau tekan Enter untuk tambah"
            value={benefitQuery}
            onChange={e => { setBenefitQuery(e.target.value); setBenefitName(e.target.value); }}
            onPressEnter={() => { if (benefitName && benefitName.trim()) handleAddBenefit(); }}
            allowClear
          />
          <Select
            placeholder="Kategori"
            style={{ minWidth: 200 }}
            mode="tags"
            options={benefitKategoriOptions}
            value={benefitKategori ? [benefitKategori] : undefined}
            onChange={(val) => {
              // mode=tags returns an array; we only keep the first value as the kategori string
              if (Array.isArray(val) && val.length > 0) {
                setBenefitKategori(val[val.length - 1]); // take the last added tag
              } else {
                setBenefitKategori('');
              }
            }}
            maxTagCount={1}
          />
          <Button type="primary" loading={addingBenefit} onClick={handleAddBenefit}>Tambah</Button>
        </div>
        <List
          dataSource={(meta.benefits || []).filter(b => {
            if (!benefitQuery || !benefitQuery.trim()) return true;
            const q = benefitQuery.trim().toLowerCase();
            const name = (b && (b.benefit || String(b))) ? String(b.benefit || b).toLowerCase() : '';
            return name.includes(q);
          })}
          bordered
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button key="edit" onClick={() => {
                  setEditingBenefit(item);
                  setEditBenefitName(item.benefit || '');
                  setEditBenefitKategori(item.nama_kategori || item.kategori || '');
                }}>Edit</Button>,
                <Popconfirm
                  title={`Hapus benefit "${item.benefit}" ?`}
                  onConfirm={async () => {
                    try {
                      if (!item.id) return message.error('Tidak ada id benefit');
                      const res = await fetch(`/api/benefit?id=${item.id}`, { method: 'DELETE' });
                      if (!res.ok) throw new Error('Gagal menghapus');
                      message.success('Benefit dihapus');
                      await fetchMeta();
                    } catch (e) {
                      message.error(e?.message || 'Gagal menghapus benefit');
                    }
                  }}
                  okText="Hapus"
                  cancelText="Batal"
                >
                  <Button key="del" danger>Hapus</Button>
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                title={item.benefit || item}
                description={item.nama_kategori || item.kategori || null}
              />
              { (item.nama_kategori || item.kategori) ? <Tag>{item.nama_kategori || item.kategori}</Tag> : null }
            </List.Item>
          )}
        />

        <Modal
          title={editingBenefit ? 'Edit Benefit' : 'Edit Benefit'}
          open={!!editingBenefit}
          onCancel={() => setEditingBenefit(null)}
          onOk={async () => {
            if (!editingBenefit) return;
            if (!editBenefitName || !editBenefitName.trim()) return message.error('Nama benefit wajib diisi');
            setEditSaving(true);
            try {
              const payload = { benefit: editBenefitName.trim() };
              if (editBenefitKategori && editBenefitKategori.trim()) payload.nama_kategori = editBenefitKategori.trim();
              const res = await fetch(`/api/benefit?id=${editingBenefit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
              if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.error || 'Gagal menyimpan perubahan');
              }
              message.success('Benefit diperbarui');
              setEditingBenefit(null);
              await fetchMeta();
            } catch (e) {
              message.error(e?.message || 'Gagal menyimpan');
            } finally {
              setEditSaving(false);
            }
          }}
          okText="Simpan"
          cancelText="Batal"
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <Input value={editBenefitName} onChange={e => setEditBenefitName(e.target.value)} placeholder="Nama benefit" />
            <Select style={{ minWidth: 200 }} mode="tags" options={benefitKategoriOptions} value={editBenefitKategori ? [editBenefitKategori] : undefined} onChange={(val) => { if (Array.isArray(val) && val.length) setEditBenefitKategori(val[val.length - 1]); else setEditBenefitKategori(''); }} maxTagCount={1} />
          </div>
        </Modal>
      </Modal>
    </div>
  );
}
