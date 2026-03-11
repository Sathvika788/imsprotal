import { useState } from 'react';
import PageShell from '../../components/layout/PageShell';
import toast from 'react-hot-toast';
import { Download, Calendar, FileSpreadsheet } from 'lucide-react';
import api from '../../services/api';

const ManagerReports = () => {
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [weeklyStartDate, setWeeklyStartDate] = useState('');
  const [weeklyEndDate, setWeeklyEndDate] = useState('');
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().toISOString().slice(0, 7));
  const [downloading, setDownloading] = useState(false);

  const downloadDailyReport = async () => {
    setDownloading(true);
    try {
      const token = JSON.parse(localStorage.getItem('ims-auth-storage') || '{}').state.token;
      
      const response = await fetch(`/api/reports/daily/${dailyDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily_report_${dailyDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Daily report downloaded!');
    } catch (error: any) {
      toast.error('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  const downloadWeeklyReport = async () => {
    if (!weeklyStartDate || !weeklyEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (new Date(weeklyStartDate) > new Date(weeklyEndDate)) {
      toast.error('Start date must be before end date');
      return;
    }

    setDownloading(true);
    try {
      const token = JSON.parse(localStorage.getItem('ims-auth-storage') || '{}').state.token;
      
      const response = await fetch(`/api/reports/weekly/${weeklyStartDate}/${weeklyEndDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weekly_report_${weeklyStartDate}_to_${weeklyEndDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Weekly report downloaded!');
    } catch (error: any) {
      toast.error('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  const downloadMonthlyReport = async () => {
    setDownloading(true);
    try {
      const token = JSON.parse(localStorage.getItem('ims-auth-storage') || '{}').state.token;
      
      const response = await fetch(`/api/reports/monthly/${monthlyMonth}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monthly_report_${monthlyMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Monthly report downloaded!');
    } catch (error: any) {
      toast.error('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <PageShell title="Download Reports">
      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Daily Report */}
        <div
          style={{
            background: '#111827',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #1f2a3c',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Calendar size={24} color="#00d4aa" />
            <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '20px' }}>Daily Report</h3>
          </div>

          <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '14px' }}>
            Download detailed daily attendance, logs, and task completion report
          </p>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
                Select Date
              </label>
              <input
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0d1b2e',
                  border: '1px solid #1f2a3c',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                }}
              />
            </div>

            <button
              onClick={downloadDailyReport}
              disabled={downloading}
              style={{
                padding: '12px 24px',
                background: '#00d4aa',
                border: 'none',
                borderRadius: '8px',
                color: '#0a0e1a',
                fontWeight: 'bold',
                cursor: downloading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: downloading ? 0.6 : 1,
              }}
            >
              <Download size={18} />
              {downloading ? 'Downloading...' : 'Download Excel'}
            </button>
          </div>
        </div>

        {/* Weekly Report */}
        <div
          style={{
            background: '#111827',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #1f2a3c',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <FileSpreadsheet size={24} color="#3b82f6" />
            <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '20px' }}>Weekly Report</h3>
          </div>

          <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '14px' }}>
            Download weekly summary with attendance percentage, logs, and tasks
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
                Start Date
              </label>
              <input
                type="date"
                value={weeklyStartDate}
                onChange={(e) => setWeeklyStartDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0d1b2e',
                  border: '1px solid #1f2a3c',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
                End Date
              </label>
              <input
                type="date"
                value={weeklyEndDate}
                onChange={(e) => setWeeklyEndDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0d1b2e',
                  border: '1px solid #1f2a3c',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                }}
              />
            </div>

            <button
              onClick={downloadWeeklyReport}
              disabled={downloading}
              style={{
                padding: '12px 24px',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: downloading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: downloading ? 0.6 : 1,
              }}
            >
              <Download size={18} />
              {downloading ? 'Downloading...' : 'Download Excel'}
            </button>
          </div>
        </div>

        {/* Monthly Report */}
        <div
          style={{
            background: '#111827',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #1f2a3c',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <FileSpreadsheet size={24} color="#8b5cf6" />
            <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '20px' }}>Monthly Report</h3>
          </div>

          <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '14px' }}>
            Download comprehensive monthly report with all metrics, projects, and stipends
          </p>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
                Select Month
              </label>
              <input
                type="month"
                value={monthlyMonth}
                onChange={(e) => setMonthlyMonth(e.target.value)}
                max={new Date().toISOString().slice(0, 7)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0d1b2e',
                  border: '1px solid #1f2a3c',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                }}
              />
            </div>

            <button
              onClick={downloadMonthlyReport}
              disabled={downloading}
              style={{
                padding: '12px 24px',
                background: '#8b5cf6',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: downloading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: downloading ? 0.6 : 1,
              }}
            >
              <Download size={18} />
              {downloading ? 'Downloading...' : 'Download Excel'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div
        style={{
          background: '#dbeafe',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #3b82f6',
          marginTop: '24px',
        }}
      >
        <p style={{ margin: '0 0 8px 0', color: '#1e40af', fontWeight: 'bold', fontSize: '14px' }}>
          📊 Report Information
        </p>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#1e3a8a', fontSize: '13px' }}>
          <li>Daily reports include attendance, logs, and task completion details</li>
          <li>Weekly reports provide attendance percentages and productivity metrics</li>
          <li>Monthly reports contain comprehensive data including projects, stipends, and leave records</li>
          <li>All reports are generated in Excel format (.xlsx)</li>
        </ul>
      </div>
    </PageShell>
  );
};

export default ManagerReports;