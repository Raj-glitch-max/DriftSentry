/**
 * Marketing Landing Page - Phase 9 Customer Acquisition
 * Problem-focused messaging for prospect conversion
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function MarketingPage() {
    const [email, setEmail] = useState('');

    const handleBetaSignup = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Connect to beta signup API
        alert('Thanks for your interest! We\'ll be in touch soon.');
        setEmail('');
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* Header */}
            <header className="border-b border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
                        <span className="text-xl font-bold">DriftSentry</span>
                    </div>
                    <Link
                        href="/login"
                        className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition-colors"
                    >
                        Login
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 py-20 text-center">
                <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                    Stop Paying for Phantom Infrastructure
                </h1>
                <p className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-3xl mx-auto">
                    Know exactly what's running, who changed it, and how much it costs you.
                    <br />
                    Detect drift in 60 seconds. Fix in 5 minutes.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                        href="#beta"
                        className="px-8 py-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all font-semibold text-lg"
                    >
                        Start Free Trial
                    </a>
                    <a
                        href="#problem"
                        className="px-8 py-4 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition-colors font-semibold text-lg"
                    >
                        See How It Works
                    </a>
                </div>
            </section>

            {/* Problem Section */}
            <section id="problem" className="max-w-7xl mx-auto px-4 py-20 border-t border-zinc-800">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-4xl font-bold mb-6">Your Infrastructure is Drifting</h2>
                        <p className="text-zinc-400 text-lg mb-6">
                            Manual changes in AWS console = forgotten changes = wasted money
                        </p>
                        <ul className="space-y-4">
                            {[
                                'Someone modifies a security group during an incident',
                                'Change isn\'t documented in Terraform',
                                'Nobody remembers it 6 months later',
                                'You\'re paying for ghost infrastructure'
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="text-red-500 mt-1">✗</span>
                                    <span className="text-zinc-300">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
                        <div className="text-6xl font-bold text-red-500 mb-4">$2-5K</div>
                        <div className="text-xl text-zinc-400">wasted per month on forgotten AWS resources</div>
                    </div>
                </div>
            </section>

            {/* Solution Section */}
            <section className="max-w-7xl mx-auto px-4 py-20 border-t border-zinc-800">
                <h2 className="text-4xl font-bold mb-12 text-center">Detect Drift Automatically</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            title: 'Automatic Detection',
                            desc: 'No manual config needed. Connect AWS and we find everything.',
                            icon: '🔍'
                        },
                        {
                            title: 'Real-Time Alerts',
                            desc: 'Slack, email, SMS notifications when drift happens.',
                            icon: '🔔'
                        },
                        {
                            title: 'Full Audit Trail',
                            desc: 'Know who changed what, when, and how much it costs.',
                            icon: '📊'
                        }
                    ].map((feature, i) => (
                        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <div className="text-4xl mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                            <p className="text-zinc-400">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3 Messaging Angles */}
            <section className="max-w-7xl mx-auto px-4 py-20 border-t border-zinc-800">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-gradient-to-br from-green-900/20 to-green-950/20 border border-green-800/50 rounded-xl p-6">
                        <h3 className="text-2xl font-bold mb-3 text-green-400">Cost Savings</h3>
                        <p className="text-zinc-300">
                            Companies waste $2-5K/month on forgotten AWS resources.
                            DriftSentry finds them in 60 seconds.
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border border-blue-800/50 rounded-xl p-6">
                        <h3 className="text-2xl font-bold mb-3 text-blue-400">Security & Compliance</h3>
                        <p className="text-zinc-300">
                            Rogue security group changes? Manual permission tweaks?
                            Know every infrastructure change instantly. Full audit trail.
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-900/20 to-purple-950/20 border border-purple-800/50 rounded-xl p-6">
                        <h3 className="text-2xl font-bold mb-3 text-purple-400">DevOps Velocity</h3>
                        <p className="text-zinc-300">
                            Stop firefighting configuration drift.
                            Automated detection + real-time alerts = peace of mind.
                        </p>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="max-w-7xl mx-auto px-4 py-20 border-t border-zinc-800">
                <h2 className="text-4xl font-bold mb-12 text-center">Simple Pricing</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            name: 'Free',
                            price: '$0',
                            features: ['3 AWS accounts', 'Email alerts', 'Basic dashboard', '7-day history']
                        },
                        {
                            name: 'Pro',
                            price: '$500',
                            period: '/month',
                            features: ['10+ AWS accounts', 'Slack + SMS alerts', 'Advanced analytics', '90-day history'],
                            highlight: true
                        },
                        {
                            name: 'Enterprise',
                            price: 'Custom',
                            features: ['Unlimited accounts', 'Custom integrations', 'Dedicated support', 'SLA guarantee']
                        }
                    ].map((plan, i) => (
                        <div
                            key={i}
                            className={`rounded-xl p-8 ${plan.highlight
                                    ? 'bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-2 border-blue-500'
                                    : 'bg-zinc-900 border border-zinc-800'
                                }`}
                        >
                            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold">{plan.price}</span>
                                {plan.period && <span className="text-zinc-400">{plan.period}</span>}
                            </div>
                            <ul className="space-y-3">
                                {plan.features.map((feature, j) => (
                                    <li key={j} className="flex items-start gap-2">
                                        <span className="text-green-500 mt-1">✓</span>
                                        <span className="text-zinc-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* Beta Signup CTA */}
            <section id="beta" className="max-w-3xl mx-auto px-4 py-20">
                <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-800 rounded-2xl p-12 text-center">
                    <h2 className="text-4xl font-bold mb-4">Start Your Free 14-Day Trial</h2>
                    <p className="text-xl text-zinc-400 mb-8">No credit card required. Setup in 5 minutes.</p>
                    <form onSubmit={handleBetaSignup} className="flex flex-col sm:flex-row gap-4 justify-center">
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="px-6 py-4 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 flex-1"
                        />
                        <button
                            type="submit"
                            className="px-8 py-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all font-semibold whitespace-nowrap"
                        >
                            Get Started Free
                        </button>
                    </form>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-zinc-800 mt-20">
                <div className="max-w-7xl mx-auto px-4 py-8 text-center text-zinc-500">
                    <p>© 2025 DriftSentry. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
