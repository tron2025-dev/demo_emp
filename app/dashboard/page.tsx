'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Attendance {
    id: number;
    date: string;
    clock_in: string | null;
    clock_out: string | null;
    total_hours: number | null;
    status: string;
}

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [attendance, setAttendance] = useState<Attendance | null>(null);
    const [recentActivity, setRecentActivity] = useState<Attendance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (user) {
            fetchAttendanceData();
        }
    }, [user]);

    const fetchAttendanceData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await fetch(`/api/attendance?startDate=${today}&endDate=${today}`);
            const data = await res.json();

            if (data.attendance && data.attendance.length > 0) {
                setAttendance(data.attendance[0]);
            }

            // Fetch recent activity
            const recentRes = await fetch('/api/attendance');
            const recentData = await recentRes.json();
            if (recentData.attendance) {
                setRecentActivity(recentData.attendance.slice(0, 5));
            }
        } catch (error) {
            console.error('Failed to fetch attendance', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClockIn = async () => {
        setActionLoading(true);
        try {
            const res = await fetch('/api/attendance/clock-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'PRESENT' }),
            });

            if (res.ok) {
                await fetchAttendanceData();
            }
        } catch (error) {
            console.error('Clock in failed', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleClockOut = async () => {
        setActionLoading(true);
        try {
            const res = await fetch('/api/attendance/clock-out', {
                method: 'POST',
            });

            if (res.ok) {
                await fetchAttendanceData();
            }
        } catch (error) {
            console.error('Clock out failed', error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading || isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    const isClockedIn = attendance?.clock_in && !attendance?.clock_out;
    const isClockedOut = attendance?.clock_in && attendance?.clock_out;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, {user.name.split(' ')[0]}
                    </h1>
                    <p className="text-gray-400 mt-1">Here&apos;s your attendance overview for today</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-mono font-bold text-primary-400">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-sm text-gray-400">
                        {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Main Action Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2 card glass p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-32 -mt-32" />

                    <div className="relative z-10">
                        <h2 className="text-xl font-semibold text-white mb-6">Today&apos;s Status</h2>

                        <div className="flex flex-col sm:flex-row items-center gap-8">
                            <div className={`w-40 h-40 rounded-full flex items-center justify-center border-4 ${isClockedIn ? 'border-green-500/50 bg-green-500/10' :
                                isClockedOut ? 'border-gray-500/50 bg-gray-500/10' :
                                    'border-primary-500/50 bg-primary-500/10'
                                } transition-all duration-500`}>
                                <div className="text-center">
                                    <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Status</div>
                                    <div className={`text-lg font-bold ${isClockedIn ? 'text-green-400' :
                                        isClockedOut ? 'text-gray-400' :
                                            'text-primary-400'
                                        }`}>
                                        {isClockedIn ? 'Working' : isClockedOut ? 'Completed' : 'Not Started'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 w-full space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-surface-light/30 p-4 rounded-xl">
                                        <div className="text-sm text-gray-400 mb-1">Clock In</div>
                                        <div className="text-xl font-mono font-semibold text-white">
                                            {attendance?.clock_in ? new Date(attendance.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </div>
                                    </div>
                                    <div className="bg-surface-light/30 p-4 rounded-xl">
                                        <div className="text-sm text-gray-400 mb-1">Clock Out</div>
                                        <div className="text-xl font-mono font-semibold text-white">
                                            {attendance?.clock_out ? new Date(attendance.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </div>
                                    </div>
                                </div>

                                {!isClockedOut && (
                                    <button
                                        onClick={isClockedIn ? handleClockOut : handleClockIn}
                                        disabled={actionLoading}
                                        className={`w-full btn ${isClockedIn ? 'btn-secondary' : 'btn-primary'
                                            } py-4 text-lg shadow-lg`}
                                    >
                                        {actionLoading ? (
                                            <span className="animate-pulse">Processing...</span>
                                        ) : isClockedIn ? (
                                            'Clock Out'
                                        ) : (
                                            'Clock In'
                                        )}
                                    </button>
                                )}

                                {isClockedOut && (
                                    <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
                                        You have completed your work day!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Card */}
                <div className="card glass p-6 space-y-6">
                    <h3 className="text-lg font-semibold text-white">Quick Stats</h3>

                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-surface-light/30 border border-white/5">
                            <div className="text-sm text-gray-400 mb-1">Total Hours Today</div>
                            <div className="text-2xl font-bold text-primary-400">
                                {attendance?.total_hours ? attendance.total_hours.toFixed(2) : '0.00'} hrs
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-surface-light/30 border border-white/5">
                            <div className="text-sm text-gray-400 mb-1">Weekly Average</div>
                            <div className="text-2xl font-bold text-secondary-400">
                                8.5 hrs
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card glass p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Recent Activity</h3>
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Clock In</th>
                                <th>Clock Out</th>
                                <th>Total Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentActivity.map((record) => (
                                <tr key={record.id}>
                                    <td>{new Date(record.date).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`badge ${record.status === 'PRESENT' ? 'badge-success' :
                                            record.status === 'ABSENT' ? 'badge-error' :
                                                'badge-warning'
                                            }`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="font-mono text-sm">
                                        {record.clock_in ? new Date(record.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </td>
                                    <td className="font-mono text-sm">
                                        {record.clock_out ? new Date(record.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </td>
                                    <td className="font-mono text-sm">
                                        {record.total_hours ? `${record.total_hours.toFixed(2)} hrs` : '-'}
                                    </td>
                                </tr>
                            ))}
                            {recentActivity.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">
                                        No recent activity found
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
