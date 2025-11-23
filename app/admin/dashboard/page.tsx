'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface DashboardStats {
    total: number;
    present: number;
    absent: number;
    leave: number;
    halfDay: number;
    missingClockOut: number;
    missingReport: number;
}

interface AttendanceRecord {
    employee_id: number;
    name: string;
    email: string;
    department: string;
    designation: string;
    clock_in: string | null;
    clock_out: string | null;
    total_hours: number | null;
    status: string;
    report_status: string | null;
}

export default function AdminDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!loading) {
            if (!user || user.role !== 'ADMIN') {
                router.push(user ? '/dashboard' : '/login');
            }
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            fetchDashboardData();
        }
    }, [user, selectedDate]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/dashboard?date=${selectedDate}`);
            const data = await res.json();

            if (data.stats) setStats(data.stats);
            if (data.attendance) setAttendance(data.attendance);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async (type: 'attendance' | 'reports') => {
        try {
            const res = await fetch(`/api/admin/export?type=${type}&startDate=${selectedDate}&endDate=${selectedDate}`);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_${selectedDate}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export failed', error);
        }
    };

    if (loading || !user || user.role !== 'ADMIN') {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-gray-400 mt-1">Overview of company attendance and performance</p>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="input py-2"
                    />
                    <div className="flex gap-2">
                        <button onClick={() => handleExport('attendance')} className="btn btn-outline py-2 text-sm">
                            Export Attendance
                        </button>
                        <button onClick={() => handleExport('reports')} className="btn btn-outline py-2 text-sm">
                            Export Reports
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card glass p-6 border-l-4 border-l-primary-500">
                    <div className="text-sm text-gray-400 mb-1">Total Employees</div>
                    <div className="text-3xl font-bold text-white">{stats?.total || 0}</div>
                </div>
                <div className="card glass p-6 border-l-4 border-l-green-500">
                    <div className="text-sm text-gray-400 mb-1">Present Today</div>
                    <div className="text-3xl font-bold text-green-400">{stats?.present || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {stats?.total ? Math.round((stats.present / stats.total) * 100) : 0}% Attendance
                    </div>
                </div>
                <div className="card glass p-6 border-l-4 border-l-red-500">
                    <div className="text-sm text-gray-400 mb-1">Absent</div>
                    <div className="text-3xl font-bold text-red-400">{stats?.absent || 0}</div>
                </div>
                <div className="card glass p-6 border-l-4 border-l-yellow-500">
                    <div className="text-sm text-gray-400 mb-1">Missing Reports</div>
                    <div className="text-3xl font-bold text-yellow-400">{stats?.missingReport || 0}</div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="card glass p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Employee Status</h2>
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Department</th>
                                <th>Status</th>
                                <th>Clock In</th>
                                <th>Clock Out</th>
                                <th>Hours</th>
                                <th>Report</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8">
                                        <div className="flex justify-center">
                                            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    </td>
                                </tr>
                            ) : attendance.length > 0 ? (
                                attendance.map((record) => (
                                    <tr key={record.employee_id}>
                                        <td>
                                            <div>
                                                <div className="font-medium text-white">{record.name}</div>
                                                <div className="text-xs text-gray-400">{record.email}</div>
                                            </div>
                                        </td>
                                        <td className="text-gray-300">{record.department || '-'}</td>
                                        <td>
                                            <span className={`badge ${record.status === 'PRESENT' ? 'badge-success' :
                                                    record.status === 'ABSENT' ? 'badge-error' :
                                                        'badge-warning'
                                                }`}>
                                                {record.status || 'ABSENT'}
                                            </span>
                                        </td>
                                        <td className="font-mono text-sm text-gray-300">
                                            {record.clock_in ? new Date(record.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="font-mono text-sm text-gray-300">
                                            {record.clock_out ? new Date(record.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="font-mono text-sm text-gray-300">
                                            {record.total_hours ? record.total_hours.toFixed(2) : '-'}
                                        </td>
                                        <td>
                                            {record.report_status ? (
                                                <span className={`badge ${record.report_status === 'APPROVED' ? 'badge-success' :
                                                        record.report_status === 'REJECTED' ? 'badge-error' :
                                                            'badge-warning'
                                                    }`}>
                                                    {record.report_status}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-500">Missing</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">
                                        No records found for this date
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
