'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { GraduationCap, Users, Shield, QrCode, Smartphone, Lock } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: QrCode,
      title: 'Auto-Rotating QR Codes',
      description: 'Military-grade encrypted QR codes that rotate every 8 seconds for maximum security'
    },
    {
      icon: Smartphone,
      title: 'Mobile-First PWA',
      description: 'Installable progressive web app with offline capabilities and native experience'
    },
    {
      icon: Lock,
      title: 'Advanced Security',
      description: 'AES encryption, role-based access control, and duplicate prevention mechanisms'
    },
    {
      icon: Users,
      title: 'Real-Time Tracking',
      description: 'Live attendance monitoring with instant updates and comprehensive analytics'
    }
  ];

  const roles = [
    {
      title: 'Student Portal',
      description: 'Scan QR codes and track your attendance',
      icon: GraduationCap,
      href: '/student/login',
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 opacity-90" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-8 shadow-lg"
            >
              <QrCode className="w-10 h-10 text-primary-600" />
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              QR Attendance
              <span className="block text-secondary-200">Management System</span>
            </h1>
            
            <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Modern, secure, and mobile-first attendance management with auto-rotating QR codes, 
              real-time tracking, and comprehensive analytics for educational institutions.
            </p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Link
                href="/student/register"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors duration-200 shadow-lg"
              >
                Get Started
              </Link>
              <Link
                href="#features"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors duration-200"
              >
                Learn More
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with modern technologies and security best practices
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portal Selection */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Student Access Portal
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Access your student dashboard to scan QR codes and track attendance
            </p>
          </motion.div>

          <div className="flex justify-center">
            <div className="w-full max-w-md">
            {roles.map((role, index) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link
                  href={role.href}
                  className={`block p-8 rounded-xl ${role.color} ${role.hoverColor} text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl`}
                >
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4">
                      <role.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{role.title}</h3>
                    <p className="text-lg opacity-90">{role.description}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-full mb-4">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">QR Attendance Management</h3>
            <p className="text-gray-400 mb-4">
              Secure, modern, and efficient attendance tracking
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <span>Built with Next.js 15</span>
              <span>•</span>
              <span>Powered by Supabase</span>
              <span>•</span>
              <span>PWA Ready</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
