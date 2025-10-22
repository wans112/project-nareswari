"use client"

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Upload, Button, List, Image, Space, Tag, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

export default function ProdukForm({
	open,
	editing,
	form,
	onCancel,
	onSubmit,
	categoryOptions,
	benefitOptions,
	benefitCategoryOptions,
	modalMedia,
	onUpload,
	onRemoveMedia,
	onSelectCover,
	onCreateCategory,
	onCreateBenefitCategory,
	onCreateBenefit,
	coverSelection,
}) {
	const title = editing ? 'Edit Produk' : 'Tambah Produk';

	const [localCategoryOptions, setLocalCategoryOptions] = useState(categoryOptions || []);
	const [localBenefitOptions, setLocalBenefitOptions] = useState(benefitOptions || []);
	const [localBenefitCategoryOptions, setLocalBenefitCategoryOptions] = useState(benefitCategoryOptions || []);

	const [newCategoryName, setNewCategoryName] = useState('');
	const [newCategorySub, setNewCategorySub] = useState('');
	const [creatingCategory, setCreatingCategory] = useState(false);

	const [newBenefitName, setNewBenefitName] = useState('');
	const [selectedBenefitCategory, setSelectedBenefitCategory] = useState(undefined);
	const [newBenefitCategoryName, setNewBenefitCategoryName] = useState('');
	const [creatingBenefitCategory, setCreatingBenefitCategory] = useState(false);
	const [showNewBenefitCategoryInput, setShowNewBenefitCategoryInput] = useState(false);
	const [creatingBenefit, setCreatingBenefit] = useState(false);
	const [showCategoryForm, setShowCategoryForm] = useState(false);
	const [showBenefitForm, setShowBenefitForm] = useState(false);

	const mediaKey = (item) => {
		if (!item) return null;
		if (item.temp) return `temp-${item.tempId}`;
		if (item.id != null) return `id-${item.id}`;
		return null;
	};

	useEffect(() => {
		setLocalCategoryOptions(categoryOptions || []);
	}, [categoryOptions]);

	useEffect(() => {
		setLocalBenefitOptions(benefitOptions || []);
	}, [benefitOptions]);

	useEffect(() => {
		setLocalBenefitCategoryOptions(benefitCategoryOptions || []);
	}, [benefitCategoryOptions]);

	useEffect(() => {
		if (!open) {
			setNewCategoryName('');
			setNewCategorySub('');
			setNewBenefitName('');
			setSelectedBenefitCategory(undefined);
			setNewBenefitCategoryName('');
			setShowCategoryForm(false);
			setShowBenefitForm(false);
			setShowNewBenefitCategoryInput(false);
		}
	}, [open]);

	const formatCategoryLabel = (nama, sub) => `${nama}${sub ? ` — ${sub}` : ''}`;

	const handleAddCategory = async () => {
		const name = newCategoryName.trim();
		const sub = newCategorySub.trim() || null;
		if (!name) {
			message.error('Nama kategori wajib diisi');
			return;
		}
		if (!onCreateCategory) return;
		setCreatingCategory(true);
		try {
			const created = await onCreateCategory({ nama_kategori: name, sub_kategori: sub });
			if (created?.id) {
				setLocalCategoryOptions(prev => {
					if (prev.some(opt => opt.value === created.id)) return prev;
					return [...prev, { label: formatCategoryLabel(created.nama_kategori, created.sub_kategori), value: created.id }];
				});
				form.setFieldValue('kategori_produk_id', created.id);
				setNewCategoryName('');
				setNewCategorySub('');
			}
		} finally {
			setCreatingCategory(false);
		}
	};

	const handleAddBenefitCategory = async () => {
		const name = newBenefitCategoryName.trim();
		if (!name) {
			message.error('Nama kategori benefit wajib diisi');
			return null;
		}
		if (!onCreateBenefitCategory) return null;
		setCreatingBenefitCategory(true);
		try {
			const created = await onCreateBenefitCategory(name);
			if (created?.id) {
				setLocalBenefitCategoryOptions(prev => {
					if (prev.some(opt => opt.value === created.id)) return prev;
					return [...prev, { label: created.nama_kategori, value: created.id }];
				});
				setSelectedBenefitCategory(created.id);
				setNewBenefitCategoryName('');
			}
			return created;
		} finally {
			setCreatingBenefitCategory(false);
		}
	};

	const handleAddBenefit = async () => {
		const name = newBenefitName.trim();
		if (!name) {
			message.error('Nama benefit wajib diisi');
			return;
		}
		if (!onCreateBenefit) return;
		setCreatingBenefit(true);
		try {
			let kategoriId = selectedBenefitCategory;
			let kategoriName;
			if (!kategoriId && newBenefitCategoryName.trim()) {
				const createdCategory = await handleAddBenefitCategory();
				if (createdCategory?.id) {
					kategoriId = createdCategory.id;
					kategoriName = createdCategory.nama_kategori;
				}
			}
			if (!kategoriId && !kategoriName) {
				message.error('Pilih kategori benefit terlebih dahulu');
				setCreatingBenefit(false);
				return;
			}
			const payload = { benefit: name };
			if (kategoriId) payload.kategori_benefit_id = kategoriId;
			else if (kategoriName) payload.nama_kategori = kategoriName;
			const created = await onCreateBenefit(payload);
			if (created?.id) {
				setLocalBenefitOptions(prev => {
					if (prev.some(opt => opt.value === created.id)) return prev;
					return [...prev, { label: created.benefit, value: created.id }];
				});
				const current = form.getFieldValue('benefits') || [];
				if (!current.includes(created.id)) {
					form.setFieldValue('benefits', [...current, created.id]);
				}
				setNewBenefitName('');
			}
		} finally {
			setCreatingBenefit(false);
		}
	};

	return (
		<Modal
			title={title}
			open={open}
			onOk={onSubmit}
			onCancel={onCancel}
			okText="Simpan"
			cancelText="Batal"
			destroyOnHidden={false}
		>
			<Form form={form} layout="vertical">
				<Form.Item
					name="nama_paket"
					label="Nama Paket"
					rules={[{ required: true, message: 'Nama paket wajib diisi' }]}
				>
					<Input />
				</Form.Item>
				<Form.Item name="harga" label="Harga">
					<InputNumber
						style={{ width: '100%' }}
						formatter={value => value ? `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
						parser={value => String(value).replace(/\D+/g, '')}
					/>
				</Form.Item>
				<Form.Item
					name="kategori_produk_id"
					label="Kategori"
					rules={[{ required: true, message: 'Pilih kategori' }]}
				>
					<Select
						showSearch
						options={localCategoryOptions}
						placeholder="Pilih kategori"
					/>
				</Form.Item>
				<div style={{ marginTop: -8, marginBottom: 16 }}>
					<Button type="link" size="small" onClick={() => setShowCategoryForm(prev => !prev)}>
						{showCategoryForm ? 'Sembunyikan form kategori' : 'Tambah kategori baru'}
					</Button>
					{showCategoryForm && (
						<Space direction="vertical" style={{ width: '100%', padding: '8px 0 4px' }}>
							<Input
								placeholder="Nama kategori baru"
								value={newCategoryName}
								onChange={(e) => setNewCategoryName(e.target.value)}
							/>
							<Input
								placeholder="Sub kategori (opsional)"
								value={newCategorySub}
								onChange={(e) => setNewCategorySub(e.target.value)}
							/>
							<Button type="primary" block loading={creatingCategory} onClick={handleAddCategory}>
								Simpan kategori
							</Button>
						</Space>
					)}
				</div>
				<Form.Item name="benefits" label="Benefits" tooltip="Pilih banyak benefit">
					<Select
						mode="multiple"
						options={localBenefitOptions}
						placeholder="Pilih benefits"
					/>
				</Form.Item>
				<div style={{ marginTop: -8, marginBottom: 16 }}>
					<Button type="link" size="small" onClick={() => setShowBenefitForm(prev => !prev)}>
						{showBenefitForm ? 'Sembunyikan form benefit' : 'Tambah benefit baru'}
					</Button>
					{showBenefitForm && (
                        <Space direction="vertical" style={{ width: '100%', padding: '8px 0 4px' }}>
                            <Input
                                placeholder="Nama benefit baru"
                                value={newBenefitName}
                                onChange={(e) => setNewBenefitName(e.target.value)}
                            />
                            <Select
                                placeholder="Pilih kategori benefit"
                                options={localBenefitCategoryOptions}
                                value={selectedBenefitCategory}
                                onChange={(val) => setSelectedBenefitCategory(val)}
                            />
                            <div>
                                <Button type="link" style={{ marginTop: 2 }} size="small" onClick={() => setShowNewBenefitCategoryInput(prev => !prev)}>
                                    {showNewBenefitCategoryInput ? 'Batal tambah kategori' : 'Tambah kategori benefit'}
                                </Button>
                                {showNewBenefitCategoryInput && (
                                    <Space align="start" style={{ width: '100%', padding: '8px 0 4px' }}>
                                        <Input
                                            placeholder="Nama kategori benefit baru"
                                            value={newBenefitCategoryName}
                                            onChange={(e) => setNewBenefitCategoryName(e.target.value)}
                                        />
                                        <Button type="primary" loading={creatingBenefitCategory} onClick={handleAddBenefitCategory}>
                                            Simpan kategori
                                        </Button>
                                    </Space>
                                )}
                            </div>
                            <Button
                                type="primary"
                                block
                                loading={creatingBenefit}
                                onClick={handleAddBenefit}
                            >
                                Tambah Benefit ke daftar
                            </Button>
                        </Space>
					)}
				</div>

				<div style={{ marginTop: 12 }}>
					<div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<div style={{ fontWeight: 600 }}>Gambar Produk</div>
						<Upload
							multiple
							accept="image/*"
							customRequest={({ file, onSuccess, onError }) => {
								onUpload(file)
									.then(() => onSuccess && onSuccess('ok'))
									.catch((err) => onError && onError(err));
							}}
							showUploadList={false}
						>
							<Button icon={<UploadOutlined />}>Upload Gambar</Button>
						</Upload>
					</div>
					<List
						dataSource={modalMedia}
						bordered
						renderItem={(item) => {
							const key = mediaKey(item);
							const isSelected = coverSelection === key;
							return (
								<List.Item
									key={key || item.media_path || item.url}
									actions={[
										<Button
											key="cover"
											type={isSelected ? 'primary' : 'default'}
											size="small"
											onClick={() => onSelectCover?.(item)}
										>
											{isSelected ? 'Cover aktif' : 'Jadikan cover'}
										</Button>,
										<Button
											key="remove"
											danger
											size="small"
											onClick={() => onRemoveMedia(item)}
										>
											Hapus
										</Button>,
									]}
								>
									<List.Item.Meta
										avatar={<Image width={56} src={item.preview || item.url} />}
										title={(
											<Space size={8}>
												<span>{item.media_path || item.file?.name || item.url || 'Gambar'}</span>
												{isSelected && <Tag color="green">Cover</Tag>}
											</Space>
										)}
									/>
								</List.Item>
							);
						}}
					/>
				</div>
			</Form>
		</Modal>
	);
}
