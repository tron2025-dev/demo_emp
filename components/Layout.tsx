'use client';

import { AuthProvider } from '@/context/AuthContext';
import Navbar from './Navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </main>
                <footer className="border-t border-white/10 py-6 mt-auto">
                    <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
                        &copy; {new Date().getFullYear()} HR Portal. All rights reserved.
                    </div>
                </footer>
            </div>
        </AuthProvider>
    );
}
