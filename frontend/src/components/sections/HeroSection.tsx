/**
 * HeroSection Component - Minimalist B&W with Spline 3D
 */

'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMetrics } from '@/hooks/useDrifts';
import { formatCurrency, formatCompactNumber } from '@/utils/format';
import { cn } from '@/utils/cn';
import { ArrowDown, Shield, DollarSign, CheckCircle } from 'lucide-react';

// ============================================
// Configuration
// ============================================

const CONFIG = {
    defaultSplineUrl: 'https://prod.spline.design/ZtgazUgc9rl2N5TV/scene.splinecode',
} as const;

// ============================================
// Loading Animation (defined first for dynamic import)
// ============================================

function LoadingOrb() {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="relative">
                <div className="w-24 h-24 rounded-full border border-white/10" />
                <div
                    className="absolute inset-0 rounded-full border-t border-white/30"
                    style={{ animation: 'spin 2s linear infinite' }}
                />
                <div className="absolute inset-4 rounded-full bg-white/5" />
            </div>
        </div>
    );
}

// Dynamic import Spline to avoid async component error
const Spline = dynamic(() => import('@splinetool/react-spline'), {
    ssr: false,
    loading: () => <LoadingOrb />,
});

// ============================================
// Animated Background Lines
// ============================================

function AnimatedBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden">
            {/* Gradient orbs */}
            <div
                className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full opacity-20"
                style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    animation: 'pulse 8s ease-in-out infinite',
                }}
            />
            <div
                className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full opacity-15"
                style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
                    animation: 'pulse 10s ease-in-out infinite reverse',
                }}
            />

            {/* Animated lines */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="line-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                    <linearGradient id="line-gradient-2" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="rgba(255,255,255,0.08)" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>

                {/* Diagonal grid lines */}
                <g className="opacity-30">
                    {[...Array(8)].map((_, i) => (
                        <line
                            key={`diag-1-${i}`}
                            x1={`${i * 15}%`}
                            y1="0"
                            x2={`${i * 15 + 40}%`}
                            y2="100%"
                            stroke="url(#line-gradient-1)"
                            strokeWidth="1"
                        />
                    ))}
                    {[...Array(6)].map((_, i) => (
                        <line
                            key={`diag-2-${i}`}
                            x1={`${100 - i * 15}%`}
                            y1="0"
                            x2={`${60 - i * 15}%`}
                            y2="100%"
                            stroke="url(#line-gradient-2)"
                            strokeWidth="1"
                        />
                    ))}
                </g>
            </svg>

            {/* Dot grid */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)`,
                    backgroundSize: '30px 30px',
                }}
            />
        </div>
    );
}

// ============================================
// Metric Card
// ============================================

interface MetricCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    delay?: number;
}

function MetricCard({ label, value, icon, delay = 0 }: MetricCardProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div
            className={cn(
                'relative px-6 py-4 rounded-xl',
                'bg-white/[0.03] backdrop-blur-md',
                'border border-white/[0.08]',
                'transition-all duration-700 ease-out',
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
                'hover:bg-white/[0.06] hover:border-white/[0.15]',
                'group cursor-default'
            )}
        >
            <div className="flex items-center gap-4">
                <div className="text-white/40 group-hover:text-white/60 transition-colors">
                    {icon}
                </div>
                <div>
                    <p className="text-xl lg:text-2xl font-semibold text-white tracking-tight">
                        {value}
                    </p>
                    <p className="text-xs text-white/40 uppercase tracking-wider">
                        {label}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Hero Section
// ============================================

interface HeroSectionProps {
    splineUrl?: string;
}

export function HeroSection({ splineUrl }: HeroSectionProps) {
    const { data: metrics, isLoading } = useMetrics();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <section className="relative min-h-screen bg-black">
                <LoadingOrb />
            </section>
        );
    }

    const sceneUrl = splineUrl || CONFIG.defaultSplineUrl;

    return (
        <section
            className="relative min-h-screen overflow-hidden bg-black"
            aria-label="DriftSentry Hero"
        >
            {/* Animated Background */}
            <AnimatedBackground />

            {/* Spline 3D Scene - Interactive */}
            <div className="absolute inset-0 z-10" style={{ pointerEvents: 'auto' }}>
                <Spline
                    scene={sceneUrl}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            {/* Gradient overlays for text legibility */}
            <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={{
                    background: `
            linear-gradient(to right, rgba(0,0,0,0.8) 0%, transparent 50%),
            linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 40%)
          `,
                }}
            />

            {/* Content */}
            <div className="relative z-30 min-h-screen flex flex-col justify-end px-6 lg:px-12 pb-16 lg:pb-20">
                <div className="max-w-5xl">
                    {/* Main heading */}
                    <div className="mb-8">
                        <p className="text-sm text-white/40 uppercase tracking-widest mb-2 animate-fade-up">
                            Infrastructure Drift
                        </p>
                        <h1
                            className="text-3xl sm:text-4xl lg:text-5xl font-medium text-white leading-tight animate-fade-up"
                            style={{ animationDelay: '100ms' }}
                        >
                            Detection & Remediation
                        </h1>

                        <p
                            className="mt-4 text-base lg:text-lg text-white/50 max-w-lg leading-relaxed animate-fade-up"
                            style={{ animationDelay: '200ms' }}
                        >
                            Monitor, detect, and automatically remediate configuration drift
                            across your cloud infrastructure in real-time.
                        </p>
                    </div>

                    {/* Metric cards */}
                    <div className="flex flex-wrap gap-3">
                        <MetricCard
                            label="Drifts Detected"
                            value={isLoading ? '—' : formatCompactNumber(metrics?.totalDrifts || 0)}
                            icon={<Shield className="w-5 h-5" />}
                            delay={300}
                        />
                        <MetricCard
                            label="Cost Saved"
                            value={isLoading ? '—' : formatCurrency(metrics?.costSavings || 0)}
                            icon={<DollarSign className="w-5 h-5" />}
                            delay={450}
                        />
                        <MetricCard
                            label="Issues Fixed"
                            value={isLoading ? '—' : formatCompactNumber(metrics?.issuesFixed || 0)}
                            icon={<CheckCircle className="w-5 h-5" />}
                            delay={600}
                        />
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                <ArrowDown className="w-4 h-4 text-white/20 animate-bounce" />
            </div>
        </section>
    );
}

HeroSection.displayName = 'HeroSection';
