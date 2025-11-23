'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Report {
    id: number;
    date: string;
    tasks_summary: string;
    time_spent_hours: number;
    blockers: string;
    tomorrow_plan: string;
    project_client: string;
    status: string;
}

export default function ReportsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        tasks_summary: '',
        time_spent_hours: '',
        blockers: '',
        tomorrow_plan: '',
        project_client: '',
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchReports();
        }
    }, [user]);

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/reports');
            const data = await res.json();
            if (data.reports) {
                setReports(data.reports);
            }
        } catch (error) {
            console.error('Failed to fetch reports', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    time_spent_hours: Number(formData.time_spent_hours),
                }),
            });

            if (res.ok) {
                await fetchReports();
                setShowForm(false);
                setFormData({
                    tasks_summary: '',
                    time_spent_hours: '',
                    blockers: '',
                    tomorrow_plan: '',
                    project_client: '',
                });
            }
        } catch (error) {
            console.error('Failed to submit report', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Daily Reports</h1>
                    <p className="text-gray-400 mt-1">Track your daily progress and tasks</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary"
                >
                    {showForm ? 'Cancel' : 'New Report'}
                </button>
            </div>

            {showForm && (
                <div className="card glass p-6 animate-slide-in">
                    <h2 className="text-xl font-semibold text-white mb-6">Submit Daily Report</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Tasks Summary
                                </label>
                                <textarea
                                    value={formData.tasks_summary}
                                    onChange={(e) => setFormData({ ...formData, tasks_summary: e.target.value })}
                                    className="input min-h-[100px]"
                                    placeholder="What did you work on today?"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Time Spent (Hours)
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={formData.time_spent_hours}
                                    onChange={(e) => setFormData({ ...formData, time_spent_hours: e.target.value })}
                                    className="input"
                                    placeholder="8.0"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Project / Client
                                </label>
                                <input
                                    type="text"
                                    value={formData.project_client}
                                    onChange={(e) => setFormData({ ...formData, project_client: e.target.value })}
                                    className="input"
                                    placeholder="Project X"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Blockers / Issues
                                </label>
                                <textarea
                                    value={formData.blockers}
                                    onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                                    className="input"
                                    placeholder="Any challenges faced?"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Plan for Tomorrow
                                </label>
                                <textarea
                                    value={formData.tomorrow_plan}
                                    onChange={(e) => setFormData({ ...formData, tomorrow_plan: e.target.value })}
                                    className="input"
                                    placeholder="What's next?"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn btn-primary"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-6">
                {reports.map((report) => (
                    <div key={report.id} className="card glass p-6 hover:border-primary-500/30 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold text-white">
                                        {new Date(report.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </h3>
                                    <span className={`badge ${report.status === 'APPROVED' ? 'badge-success' :
                                            report.status === 'REJECTED' ? 'badge-error' :
                                                'badge-warning'
                                        }`}>
                                        {report.status}
                                    </span>
                                </div>
                                {report.project_client && (
                                    <div className="text-sm text-primary-400 mt-1">{report.project_client}</div>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-white">{report.time_spent_hours}h</div>
                                <div className="text-xs text-gray-400">Time Spent</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-gray-400 mb-1">Tasks Completed</div>
                                <p className="text-gray-200 whitespace-pre-wrap">{report.tasks_summary}</p>
                            </div>

                            {report.blockers && (
                                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                                    <div className="text-sm font-medium text-red-400 mb-1">Blockers</div>
                                    <p className="text-gray-200 text-sm">{report.blockers}</p>
                                </div>
                            )}

                            {report.tomorrow_plan && (
                                <div className="bg-surface-light/30 p-3 rounded-lg">
                                    <div className="text-sm font-medium text-gray-400 mb-1">Plan for Tomorrow</div>
                                    <p className="text-gray-200 text-sm">{report.tomorrow_plan}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {reports.length === 0 && !showForm && (
                    <div className="text-center py-12 card glass">
                        <div className="text-gray-400 mb-4">No reports found</div>
                        <button onClick={() => setShowForm(true)} className="text-primary-400 hover:text-primary-300">
                            Create your first report
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
