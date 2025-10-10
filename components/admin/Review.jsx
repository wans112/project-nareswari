
"use client";

import { useCallback, useEffect, useState } from "react";
import {
	Button,
	Form,
	Input,
	Modal,
	Popconfirm,
	Rate,
	Space,
	Table,
	Tag,
	Typography,
	message,
} from "antd";

const { Text, Title, Link: AntLink } = Typography;

const initialFormValues = {
	nama: "",
	isi: "",
	rating: 5,
	href: "",
	sumber: "",
};

export default function ReviewAdmin() {
	const [form] = Form.useForm();
	const [records, setRecords] = useState([]);
	const [loading, setLoading] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingRow, setEditingRow] = useState(null);
	const [saving, setSaving] = useState(false);

	const loadReviews = useCallback(async () => {
		try {
			setLoading(true);
			const res = await fetch("/api/reviews", { cache: "no-store" });
			if (!res.ok) throw new Error("Gagal memuat review");
			const data = await res.json();
			setRecords(Array.isArray(data) ? data : []);
		} catch (err) {
			console.error(err);
			message.error(err.message || "Terjadi kesalahan saat memuat review");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadReviews();
	}, [loadReviews]);

	const resetModalState = () => {
		form.resetFields();
		setEditingRow(null);
		setModalOpen(false);
		setSaving(false);
	};

	const handleOpenCreate = () => {
		setEditingRow(null);
		form.setFieldsValue(initialFormValues);
		setModalOpen(true);
	};

	const handleOpenEdit = (record) => {
		setEditingRow(record);
		form.setFieldsValue({
			nama: record.nama || "",
			isi: record.isi || "",
			rating: record.rating || 5,
			href: record.href || "",
			sumber: record.sumber || "",
		});
		setModalOpen(true);
	};

	const handleSave = async () => {
		try {
			const values = await form.validateFields();
			setSaving(true);

			const payload = {
				nama: values.nama.trim(),
				isi: values.isi.trim(),
				rating: values.rating,
				href: values.href ? values.href.trim() : null,
				sumber: values.sumber ? values.sumber.trim() : null,
			};

			const method = editingRow ? "PUT" : "POST";
			const url = editingRow ? `/api/reviews?id=${editingRow.id}` : "/api/reviews";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const body = await res.json();
			if (!res.ok) throw new Error(body?.error || "Gagal menyimpan review");

			message.success(editingRow ? "Review diperbarui" : "Review ditambahkan");
			resetModalState();
			loadReviews();
		} catch (err) {
			if (err?.errorFields) return; // AntD validation already shows messages
			console.error(err);
			message.error(err.message || "Gagal menyimpan review");
			setSaving(false);
		}
	};

	const handleDelete = async (record) => {
		try {
			const res = await fetch(`/api/reviews?id=${record.id}`, { method: "DELETE" });
			const body = await res.json();
			if (!res.ok) throw new Error(body?.error || "Gagal menghapus review");
			message.success("Review dihapus");
			loadReviews();
		} catch (err) {
			console.error(err);
			message.error(err.message || "Gagal menghapus review");
		}
	};

	const columns = [
		{
			title: "Nama",
			dataIndex: "nama",
			key: "nama",
			render: (value) => <Text strong>{value}</Text>,
		},
		{
			title: "Rating",
			dataIndex: "rating",
			key: "rating",
			width: 140,
			render: (value) => <Rate disabled value={Number(value) || 0} />, 
		},
		{
			title: "Sumber",
			dataIndex: "sumber",
			key: "sumber",
			render: (value) => (value ? <Tag color="blue">{value}</Tag> : <Tag>Manual</Tag>),
		},
		{
			title: "Tautan",
			dataIndex: "href",
			key: "href",
			render: (value) => (value ? <AntLink href={value} target="_blank">Lihat</AntLink> : "-"),
		},
		{
			title: "Dibuat",
			dataIndex: "created_at",
			key: "created_at",
			render: (value) => {
				if (!value) return "-";
				const date = new Date(value);
				if (Number.isNaN(date.getTime())) return value;
				return new Intl.DateTimeFormat("id-ID", {
					day: "2-digit",
					month: "short",
					year: "numeric",
					hour: "2-digit",
					minute: "2-digit",
				}).format(date);
			},
		},
		{
			title: "Aksi",
			key: "action",
			width: 180,
			render: (_, record) => (
				<Space>
					<Button size="small" onClick={() => handleOpenEdit(record)}>Edit</Button>
					<Popconfirm
						title="Hapus review"
						description={`Hapus review dari ${record.nama}?`}
						okText="Hapus"
						cancelText="Batal"
						okButtonProps={{ danger: true }}
						onConfirm={() => handleDelete(record)}
					>
						<Button size="small" danger>Hapus</Button>
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<Title level={4} className="!mb-0">Manajemen Review</Title>
					<Text type="secondary">Kelola ulasan pelanggan yang tampil di landing page.</Text>
				</div>
				<Button type="primary" onClick={handleOpenCreate}>Tambah Review</Button>
			</div>

			<Table
				rowKey="id"
				loading={loading}
				dataSource={records}
				columns={columns}
				pagination={{ pageSize: 10, showSizeChanger: false }}
			/>

			<Modal
				open={modalOpen}
				title={editingRow ? "Edit Review" : "Tambah Review"}
				onCancel={resetModalState}
				onOk={handleSave}
				confirmLoading={saving}
				okText={editingRow ? "Simpan" : "Tambah"}
				destroyOnHidden
			>
				<Form
					form={form}
					layout="vertical"
					initialValues={initialFormValues}
				>
					<Form.Item
						label="Nama pelanggan"
						name="nama"
						rules={[{ required: true, message: "Nama wajib diisi" }]}
					>
						<Input placeholder="Nama pelanggan" />
					</Form.Item>

					<Form.Item
						label="Rating"
						name="rating"
						rules={[{ required: true, message: "Rating wajib diisi" }]}
					>
						<Rate allowHalf={false} />
					</Form.Item>

					<Form.Item
						label="Isi review"
						name="isi"
						rules={[{ required: true, message: "Isi review wajib diisi" }]}
					>
						<Input.TextArea rows={4} placeholder="Masukkan testimoni pelanggan" />
					</Form.Item>

					<Form.Item
						label="Tautan sumber (opsional)"
						name="href"
						rules={[{ type: "url", warningOnly: true, message: "Masukkan URL valid" }]}
					>
						<Input placeholder="https://" />
					</Form.Item>

					<Form.Item
						label="Sumber (opsional)"
						name="sumber"
					>
						<Input placeholder="Contoh: Google Maps, Instagram" />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
