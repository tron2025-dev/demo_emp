'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Employee {
    id: number;
    name: string;
    email: string;
    phone: string;
    department: string;
    designation: string;
    role: string;
    status: string;
    date_joined: string;
}

export default function EmployeesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        department: '',
        designation: '',
        role: 'EMPLOYEE',
    });

    useEffect(() => {
        if (!loading) {
            if (!user || user.role !== 'ADMIN') {
                router.push(user ? '/dashboard' : '/login');
            }
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            fetchEmployees();
        }
    }, [user]);

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/admin/employees');
            const data = await res.json();
            if (data.employees) {
                setEmployees(data.employees);
            }
        } catch (error) {
            console.error('Failed to fetch employees', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/admin/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                await fetchEmployees();
                setShowForm(false);
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    phone: '',
                    department: '',
                    designation: '',
                    role: 'EMPLOYEE',
                });
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create employee');
            }
        } catch (error) {
            console.error('Failed to create employee', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStatus = async (id: number, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            const res = await fetch('/api/admin/employees', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus }),
            });

            if (res.ok) {
                fetchEmployees();
            }
        } catch (error) {
            console.error('Failed to update status', error);
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Employees</h1>
                    <p className="text-gray-400 mt-1">Manage your team members</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary"
                >
                    {showForm ? 'Cancel' : 'Add Employee'}
                </button>
            </div>

            {showForm && (
                <div className="card glass p-6 animate-slide-in">
                    <h2 className="text-xl font-semibold text-white mb-6">Add New Employee</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Department
                                </label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Designation
                                </label>
                                <input
                                    type="text"
                                    value={formData.designation}
                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Role
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="input"
                                >
                                    <option value="EMPLOYEE">Employee</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn btn-primary"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Employee'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card glass p-6">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Designation</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
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
                            ) : employees.length > 0 ? (
                                employees.map((employee) => (
                                    <tr key={employee.id}>
                                        <td>
                                            <div>
                                                <div className="font-medium text-white">{employee.name}</div>
                                                <div className="text-xs text-gray-400">{employee.email}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded ${employee.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {employee.role}
                                            </span>
                                        </td>
                                        <td className="text-gray-300">{employee.department || '-'}</td>
                                        <td className="text-gray-300">{employee.designation || '-'}</td>
                                        <td>
                                            <span className={`badge ${employee.status === 'ACTIVE' ? 'badge-success' : 'badge-error'
                                                }`}>
                                                {employee.status}
                                            </span>
                                        </td>
                                        <td className="text-gray-400 text-sm">
                                            {new Date(employee.date_joined).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => toggleStatus(employee.id, employee.status)}
                                                className={`text-xs font-medium px-3 py-1 rounded transition-colors ${employee.status === 'ACTIVE'
                                                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                        : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                                    }`}
                                            >
                                                {employee.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">
                                        No employees found
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
