/**
 * Settings Page - Clean B&W
 */

'use client';

import React from 'react';
import { Header, Sidebar, Footer } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useDarkMode } from '@/hooks/useDarkMode';
import { cn } from '@/utils/cn';

export default function SettingsPage() {
    const { isDarkMode, toggleDarkMode } = useDarkMode();

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />

            <div className="flex flex-1">
                <Sidebar />

                <main className="flex-1 overflow-x-hidden">
                    <div className="px-4 lg:px-8 py-8 max-w-3xl mx-auto">
                        <h1 className="text-2xl font-bold mb-8">Settings</h1>

                        {/* Appearance */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Appearance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between py-3">
                                    <div>
                                        <p className="font-medium">Dark Mode</p>
                                        <p className="text-sm text-muted-foreground">Toggle theme</p>
                                    </div>
                                    <button
                                        onClick={toggleDarkMode}
                                        className={cn(
                                            'relative w-12 h-6 rounded-full transition-colors',
                                            isDarkMode ? 'bg-foreground' : 'bg-border'
                                        )}
                                        role="switch"
                                        aria-checked={isDarkMode}
                                    >
                                        <span
                                            className={cn(
                                                'absolute top-1 w-4 h-4 bg-background rounded-full transition-transform',
                                                isDarkMode ? 'translate-x-6' : 'translate-x-1'
                                            )}
                                        />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notifications */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Notifications</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {['Email Notifications', 'Slack Integration', 'Critical Alerts Only'].map((item) => (
                                    <div key={item} className="flex items-center justify-between py-2">
                                        <p className="text-sm">{item}</p>
                                        <input type="checkbox" className="h-4 w-4 rounded border-border" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Account */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Account</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input label="Email" type="email" defaultValue="admin@example.com" disabled />
                                <Input label="API Key" type="password" defaultValue="sk-xxxx" helper="Keep this secret" />
                                <Button variant="outline">Regenerate API Key</Button>
                            </CardContent>
                        </Card>

                        {/* Danger */}
                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Delete Account</p>
                                        <p className="text-sm text-muted-foreground">This action is irreversible</p>
                                    </div>
                                    <Button variant="destructive">Delete</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Footer />
                </main>
            </div>
        </div>
    );
}
