'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Input, message, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

// Helper functions for number conversion
const toDisplayNumber = (whatsappNumber) => {
  if (!whatsappNumber || !whatsappNumber.includes('@c.us')) return whatsappNumber;
  const num = whatsappNumber.replace('@c.us', '');
  if (num.startsWith('628')) {
    return '0' + num.slice(2);
  }
  return num;
};

const toWhatsappNumber = (displayNumber) => {
  if (!displayNumber) return '';
  let num = displayNumber.replace(/\D/g, ''); // remove non-digits
  if (num.startsWith('62')) {
    // already international
  } else if (num.startsWith('0')) {
    num = '62' + num.slice(1);
  } else {
    // assume local, add 62
    num = '62' + num;
  }
  return num + '@c.us';
};

export default function NotifikasiNomor() {
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [config, setConfig] = useState({});

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data);
      setNumbers(data.notificationNumbers || []);
    } catch (error) {
      message.error('Gagal memuat config');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newNumber.trim()) {
      message.error('Nomor tidak boleh kosong');
      return;
    }
    const whatsappNum = toWhatsappNumber(newNumber.trim());
    if (!whatsappNum || whatsappNum.length < 15 || whatsappNum.length > 20) { // rough check for valid length
      message.error('Format nomor tidak valid');
      return;
    }
    if (numbers.includes(whatsappNum)) {
      message.error('Nomor sudah ada');
      return;
    }
    const newNumbers = [...numbers, whatsappNum];
    setNumbers(newNumbers);
    setNewNumber('');
    setModalVisible(false);
    await saveConfig(newNumbers);
  };

  const handleRemove = async (whatsappNumber) => {
    const newNumbers = numbers.filter(n => n !== whatsappNumber);
    setNumbers(newNumbers);
    await saveConfig(newNumbers);
  };

  const saveConfig = async (newNumbers) => {
    try {
      const newConfig = { ...config, notificationNumbers: newNumbers };
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (res.ok) {
        message.success('Nomor berhasil disimpan');
      } else {
        throw new Error();
      }
    } catch (error) {
      message.error('Gagal menyimpan nomor');
    }
  };

  const columns = [
    {
      title: 'Nomor WhatsApp',
      dataIndex: 'displayNumber',
      key: 'displayNumber',
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_, record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemove(record.whatsappNumber)}
        >
          Hapus
        </Button>
      ),
    },
  ];

  const dataSource = numbers.map((num, index) => ({
    key: index,
    displayNumber: toDisplayNumber(num),
    whatsappNumber: num
  }));

  return (
    <div>
      <h2>Manajemen Nomor Notifikasi</h2>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          Tambah Nomor
        </Button>
      </Space>
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={false}
      />
      <Modal
        title="Tambah Nomor WhatsApp"
        open={modalVisible}
        onOk={handleAdd}
        onCancel={() => setModalVisible(false)}
      >
        <Input
          placeholder="Masukkan nomor"
          value={newNumber}
          onChange={(e) => setNewNumber(e.target.value)}
        />
      </Modal>
    </div>
  );
}
