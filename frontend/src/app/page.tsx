/**
 * Dashboard Page - Main landing page
 */

'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Header, Sidebar, Footer } from '@/components/layout';
import { MetricsOverlay, DriftCards, CostChart, AlertsSidebar } from '@/components/sections';

// Lazy load Hero Section (heavy Spline 3D)
const HeroSection = dynamic(
  () => import('@/components/sections/HeroSection').then((mod) => ({ default: mod.HeroSection })),
  {
    loading: () => (
      <section className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border border-border animate-pulse" />
      </section>
    ),
    ssr: false,
  }
);

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden">
          {/* Hero with Spline 3D */}
          <HeroSection />

          {/* Content */}
          <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
            <MetricsOverlay />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <DriftCards />
                <CostChart />
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-20">
                  <AlertsSidebar />
                </div>
              </div>
            </div>
          </div>

          <Footer />
        </main>
      </div>
    </div>
  );
}
