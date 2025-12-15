'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/services/authApi';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await authApi.login({ email, password });
            // Map the response user to the store user type (adjusting for role mismatch if any)
            login({
                id: response.user.id,
                email: response.user.email,
                name: response.user.name,
                role: response.user.role as 'admin' | 'user' | 'viewer',
            }, response.token);

            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome Back</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                        Sign in to access your DriftSentry dashboard
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={isLoading}
                        >
                            Sign In
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
