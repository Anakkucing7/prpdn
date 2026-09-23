"use client";
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { demoRows } from '@/data/import-demo';
import { ValidationWorkspace, WorkflowNotice } from './validation-workspace';

export default function ValidationPage() {
  const [rows, setRows] = useState(() => [...demoRows('total', 'mixed'), ...demoRows('pillar', 'mixed')]);
  return <div className="data-page workflow-page"><PageHeader title="Validasi Data" parent="Pengelolaan Data" description="Periksa temuan, telusuri nilai sumber, dan catat keputusan tinjauan data." /><WorkflowNotice /><p className="workflow-context">12 baris sampel mandiri untuk demonstrasi. Data tidak berasal dari file yang dipilih di halaman Import. Perubahan hilang saat halaman dimuat ulang atau ditinggalkan.</p><ValidationWorkspace rows={rows} onRows={setRows} /><p className="data-source">Nilai asli dapat ditelusuri ke fact_total_idsd dan fact_skor_pilar. Tahun 2030, nilai kosong, teks nonnumerik, dan duplikat dibuat khusus untuk skenario demo. Kualitas data selalu diperiksa ulang setelah koreksi; keputusan tinjauan tidak mengubah nilai sumber.</p></div>;
}
