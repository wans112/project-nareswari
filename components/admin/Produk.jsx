"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Form, Space, Tag, message, Popconfirm} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import ProdukForm from './produk/ProdukForm';

export default function ProdukAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [meta, setMeta] = useState({ categories: [], benefits: [], benefitCategories: [] });
  // benefit UI: simple select populated from meta.benefits
  
  const [modalMedia, setModalMedia] = useState([]); // media attached in product modal (objects {id, url, media_path})
  const [coverSelection, setCoverSelection] = useState(null);

  const mediaKey = (item) => {
    if (!item) return null;
    if (item.temp) return `temp-${item.tempId}`;
    if (item.id != null) return `id-${item.id}`;
    return null;
  };

  const applyCoverFlag = (items, key) => {
    const selectedKey = key || null;
    return (items || []).map((item) => ({
      ...item,
      is_cover: selectedKey ? selectedKey === mediaKey(item) : false,
    }));
  };

  const benefitOptions = useMemo(
    () => meta.benefits.map(b => ({ label: b.benefit, value: b.id })),
    [meta]
  );
  const categoryOptions = useMemo(
    () => meta.categories.map(c => ({ label: `${c.nama_kategori}${c.sub_kategori ? ` — ${c.sub_kategori}` : ''}`, value: c.id })),
    [meta]
  );
  const benefitCategoryOptions = useMemo(
    () => (meta.benefitCategories || []).map(k => ({ label: k.nama_kategori, value: k.id })),
    [meta]
  );

  async function fetchMeta() {
    try {
      // fetch categories (produk), full benefits (with kategori), and kategori_benefit list
      const [prodRes, benRes, benCatRes] = await Promise.all([
        fetch('/api/produk?meta=1', { cache: 'no-store' }),
        fetch('/api/benefit', { cache: 'no-store' }),
        fetch('/api/benefit/kategori', { cache: 'no-store' })
      ]);
      const prodMeta = await prodRes.json();
      let benefits = [];
      try { benefits = await benRes.json(); } catch (_) { benefits = prodMeta?.benefits || []; }
      let benefitCategories = [];
      try {
        benefitCategories = benCatRes.ok ? await benCatRes.json() : [];
      } catch (_) {
        benefitCategories = [];
      }
      setMeta({
        categories: prodMeta?.categories || [],
        benefits: Array.isArray(benefits) ? benefits : (prodMeta?.benefits || []),
        benefitCategories: Array.isArray(benefitCategories) ? benefitCategories : []
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
    setCoverSelection(null);
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
        const normalized = Array.isArray(j) ? j.map(item => ({ ...item, is_cover: Boolean(item.is_cover) })) : [];
        const currentCover = normalized.find(item => item.is_cover);
        const key = currentCover ? mediaKey(currentCover) : null;
        setCoverSelection(key);
        setModalMedia(applyCoverFlag(normalized, key));
      } catch (e) { console.error(e); }
    })();
    setOpen(true);
  }

  async function handleSubmit() {
    try {
      const vals = await form.validateFields();
      // if there are temporary files in modalMedia (temp === true), upload them first
      const tempFiles = modalMedia.filter(m => m.temp === true);
      const uploadedIds = [];
      const uploadedMap = new Map();
      for (const t of tempFiles) {
        const fd = new FormData();
        fd.append('file', t.file);
        const res = await fetch('/api/media', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Gagal mengunggah salah satu gambar');
        const j = await res.json();
        uploadedIds.push(j.id);
        if (t.tempId) uploadedMap.set(t.tempId, j.id);
      }

      // collect all media ids: existing ones (have id) + newly uploaded
      const existingIds = modalMedia.filter(m => !m.temp).map(m => m.id);
      const allMediaIds = [...existingIds, ...uploadedIds];

      let coverMediaId = null;
      let coverSpecified = false;
      if (coverSelection) {
        coverSpecified = true;
        if (coverSelection.startsWith('id-')) {
          const parsed = Number(coverSelection.slice(3));
          if (!Number.isNaN(parsed)) coverMediaId = parsed;
        } else if (coverSelection.startsWith('temp-')) {
          const tempId = coverSelection.slice(5);
          const mapped = uploadedMap.get(tempId);
          if (mapped) coverMediaId = mapped;
        }
      }
      if (!coverSelection && modalMedia.length === 0) {
        coverSpecified = true;
        coverMediaId = null;
      }

      const payload = {
        nama_paket: vals.nama_paket,
        harga: vals.harga ?? null,
        kategori_produk_id: vals.kategori_produk_id ?? undefined,
        benefits: vals.benefits || [],
        media_ids: allMediaIds
      };
      if (coverSpecified) {
        payload.cover_media_id = coverMediaId;
      }
      if (editing) {
        await fetch(`/api/produk?id=${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch('/api/produk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      setOpen(false);
      modalMedia.forEach(item => {
        if (item?.temp && item.preview) {
          URL.revokeObjectURL(item.preview);
        }
      });
      setModalMedia([]);
      setCoverSelection(null);
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
  async function handleModalUpload(file) {
    // validate file is an image
    function isImage(f) {
      if (!f) return false;
      if (f.type) return f.type.startsWith('image/');
      const n = (f.name || '').toLowerCase();
      const ext = n.split('.').pop();
      return ['jpg','jpeg','png','gif','webp'].includes(ext);
    }

    if (!isImage(file)) {
      message.error('Hanya file gambar yang diperbolehkan');
      throw new Error('Invalid image file');
    }

    // make upload temporary: store File and a local preview, upload later when user clicks Save
    try {
      const preview = URL.createObjectURL(file);
      // create a unique tempId so we can remove this specific temp item later
      const tempId = `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
      const tmp = { temp: true, tempId, file, preview, media_path: file.name };
      const key = mediaKey(tmp);
      const nextKey = coverSelection || key;
      setModalMedia(prev => applyCoverFlag([...(prev || []), tmp], nextKey));
      if (!coverSelection) setCoverSelection(nextKey);
      return tmp;
    } catch (e) {
      message.error('Gagal menyiapkan file');
      throw e;
    }
  }

  async function handleDeleteMedia(id) {
    const res = await fetch(`/api/media?id=${id}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error('Gagal menghapus media');
    }
  }

  async function handleRemoveMedia(item) {
    if (!item) return;
    const key = mediaKey(item);
    if (item.temp) {
      let nextKey = coverSelection;
      setModalMedia(prev => {
        const filtered = (prev || []).filter(x => (x.temp ? x.tempId !== item.tempId : true));
        if (coverSelection === key) {
          nextKey = filtered.length > 0 ? mediaKey(filtered[0]) : null;
        }
        return applyCoverFlag(filtered, nextKey);
      });
      if (coverSelection === key) {
        setCoverSelection(nextKey);
      }
      if (item.preview) {
        URL.revokeObjectURL(item.preview);
      }
      message.success('Gambar dihapus');
      return;
    }

    try {
      await handleDeleteMedia(item.id);
      let nextKey = coverSelection;
      setModalMedia(prev => {
        const filtered = (prev || []).filter(x => x.id !== item.id);
        if (coverSelection === key) {
          nextKey = filtered.length > 0 ? mediaKey(filtered[0]) : null;
        }
        return applyCoverFlag(filtered, nextKey);
      });
      if (coverSelection === key) {
        setCoverSelection(nextKey);
      }
      message.success('Gambar dihapus');
    } catch (err) {
      message.error(err?.message || 'Gagal menghapus gambar');
    }
  }

  function handleSelectCover(item) {
    if (!item) return;
    const key = mediaKey(item);
    if (!key) return;
    setCoverSelection(key);
    setModalMedia(prev => applyCoverFlag(prev, key));
  }

  async function handleCreateCategory({ nama_kategori, sub_kategori }) {
    try {
      const res = await fetch('/api/kategori-produk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_kategori, sub_kategori })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Gagal menambah kategori');
      }
      const created = await res.json();
      setMeta(prev => {
        const exists = prev.categories.some(c => c.id === created.id);
        const categories = exists ? prev.categories : [...prev.categories, created];
        return { ...prev, categories };
      });
      message.success('Kategori ditambahkan');
      return created;
    } catch (err) {
      message.error(err?.message || 'Gagal menambah kategori');
      throw err;
    }
  }

  async function handleCreateBenefitCategory(nama_kategori) {
    try {
      const res = await fetch('/api/benefit/kategori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_kategori })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Gagal menambah kategori benefit');
      }
      const created = await res.json();
      setMeta(prev => {
        const exists = prev.benefitCategories.some(k => k.id === created.id);
        const benefitCategories = exists ? prev.benefitCategories : [...prev.benefitCategories, created];
        return { ...prev, benefitCategories };
      });
      message.success('Kategori benefit ditambahkan');
      return created;
    } catch (err) {
      message.error(err?.message || 'Gagal menambah kategori benefit');
      throw err;
    }
  }

  async function handleCreateBenefit({ benefit, kategori_benefit_id, nama_kategori }) {
    try {
      const res = await fetch('/api/benefit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ benefit, kategori_benefit_id, nama_kategori })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Gagal menambah benefit');
      }
      const created = await res.json();
      setMeta(prev => {
        const benefitExists = prev.benefits.some(b => b.id === created.id);
        const benefits = benefitExists ? prev.benefits : [...prev.benefits, created];
        const hasKategori = created.nama_kategori;
        let benefitCategories = prev.benefitCategories;
        if (hasKategori) {
          const kategoriExists = prev.benefitCategories.some(k => k.nama_kategori === created.nama_kategori || k.id === created.kategori_benefit_id);
          if (!kategoriExists) {
            benefitCategories = [...prev.benefitCategories, { id: created.kategori_benefit_id, nama_kategori: created.nama_kategori }];
          }
        }
        return { ...prev, benefits, benefitCategories };
      });
      message.success('Benefit ditambahkan');
      return created;
    } catch (err) {
      message.error(err?.message || 'Gagal menambah benefit');
      throw err;
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
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>Edit</Button>
        <Popconfirm title="Hapus Produk?" onConfirm={() => handleDelete(r.id)}>
          <Button size="small" danger icon={<DeleteOutlined />}>Hapus</Button>
        </Popconfirm>
      </Space>
    ) }
  ];

  return (
    <div>
      <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 16 }}>Manajemen Produk</h2>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Tambah Produk</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} />

      <ProdukForm
        open={open}
        editing={editing}
        form={form}
        onCancel={() => setOpen(false)}
        onSubmit={handleSubmit}
        categoryOptions={categoryOptions}
        benefitOptions={benefitOptions}
        benefitCategoryOptions={benefitCategoryOptions}
        modalMedia={modalMedia}
        coverSelection={coverSelection}
        onUpload={handleModalUpload}
        onRemoveMedia={handleRemoveMedia}
        onSelectCover={handleSelectCover}
        onCreateCategory={handleCreateCategory}
        onCreateBenefitCategory={handleCreateBenefitCategory}
        onCreateBenefit={handleCreateBenefit}
      />

    </div>
  );
}
