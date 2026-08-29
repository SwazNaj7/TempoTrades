'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation';
import { TrendingUp, BarChart3, MessageSquare, Shield, ArrowRight } from 'lucide-react';

export function HomeContent() {
  return (
    // Force dark mode for home page
    <div className="dark overflow-x-hidden">
      <BackgroundGradientAnimation
        gradientBackgroundStart="rgb(0, 0, 30)"
        gradientBackgroundEnd="rgb(0, 0, 0)"
        firstColor="0, 150, 255"
        secondColor="255, 0, 150"
        thirdColor="0, 255, 200"
        fourthColor="255, 100, 0"
        fifthColor="150, 0, 255"
        pointerColor="255, 255, 255"
        size="80%"
        blendingValue="hard-light"
        containerClassName="min-h-screen! h-auto! w-full! max-w-full! overflow-x-hidden!"
        className="min-h-screen! h-auto!"
      >
        {/* Content */}
        <div className="relative z-10 min-h-screen w-full max-w-full overflow-x-hidden">
          {/* Navigation */}
          <div className="container mx-auto px-4 py-4 md:py-6">
            <nav className="flex justify-between items-center">
              <h1 className="text-xl md:text-2xl font-light tracking-[0.14em] text-white">
                TempoTrades
              </h1>
              <div className="flex items-center gap-1 md:gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 text-sm md:text-base px-3 md:px-4">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-white text-black hover:bg-white/90 text-sm md:text-base px-3 md:px-4">
                    Get Started
                  </Button>
                </Link>
              </div>
            </nav>
          </div>

          {/* Hero Section */}
          <div className="container mx-auto px-4 pt-6 md:pt-8 pb-12 md:pb-20">
            {/* Glowing White Title */}
            <div className="flex items-center justify-center mb-6 md:mb-8">
              <h2 
                className="text-5xl sm:text-6xl md:text-8xl font-bold text-white tracking-tight animate-glow"
              >
                MECHIFY
              </h2>
            </div>

            {/* Subtitle and CTA */}
            <div className="max-w-3xl mx-auto text-center space-y-6 md:space-y-8 px-2">
              <p className="text-lg sm:text-xl md:text-2xl text-white/70">
                Master Your Trading with{' '}
                <span className="text-white font-semibold">AI-Powered</span> Journaling
              </p>
              <p className="text-sm md:text-base text-white/50 max-w-2xl mx-auto">
                Track your trades, analyze your charts with AI Vision, and get
                personalized feedback based on the popularised{' '}
                <a
                  className="font-semibold text-white/70 hover:text-white underline underline-offset-4 transition-colors"
                  href="https://www.youtube.com/watch?v=n8FqECMb-9o"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mech Model
                </a>
                .
              </p>
              <div className="flex justify-center gap-4 pt-2">
                <Link href="/signup">
                  <Button size="lg" className="h-11 md:h-12 px-6 md:px-8 text-sm md:text-base font-semibold group bg-white text-black hover:bg-white/90">
                    Start Free Today
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-16 md:mt-24 max-w-6xl mx-auto">
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-5 md:p-6 hover:bg-white/10 transition-colors">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-white/10 flex items-center justify-center mb-3 md:mb-4">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2 text-white text-sm md:text-base">Smart Trade Logging</h3>
                <p className="text-xs md:text-sm text-white/60">
                  Upload screenshots and let AI analyze your setups automatically
                </p>
              </div>

              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-5 md:p-6 hover:bg-white/10 transition-colors">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-white/10 flex items-center justify-center mb-3 md:mb-4">
                  <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2 text-white text-sm md:text-base">Analytics Dashboard</h3>
                <p className="text-xs md:text-sm text-white/60">
                  Track win rates, grade distribution, and session performance
                </p>
              </div>

              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-5 md:p-6 hover:bg-white/10 transition-colors">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-white/10 flex items-center justify-center mb-3 md:mb-4">
                  <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2 text-white text-sm md:text-base">AI Trading Buddy</h3>
                <p className="text-xs md:text-sm text-white/60">
                  Chat with an AI trained on mechanical trading principles
                </p>
              </div>

              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-5 md:p-6 hover:bg-white/10 transition-colors">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-white/10 flex items-center justify-center mb-3 md:mb-4">
                  <Shield className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2 text-white text-sm md:text-base">Secure & Private</h3>
                <p className="text-xs md:text-sm text-white/60">
                  Your trade data is encrypted and never shared
                </p>
              </div>
            </div>

            {/* Footer */}
            <footer className="mt-16 md:mt-24 text-center text-xs md:text-sm text-white/40 pb-6 md:pb-8">
              <p>© {new Date().getFullYear()} TempoTrades. Built for serious traders.</p>
            </footer>
          </div>
        </div>
      </BackgroundGradientAnimation>
    </div>
  );
}
