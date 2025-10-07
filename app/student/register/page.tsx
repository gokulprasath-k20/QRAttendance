'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { GraduationCap, Mail, Lock, User, Hash, ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { useAuth } from '../../../lib/auth';
import { isValidRegNo, isValidEmail } from '../../../lib/utils';

export default function StudentRegisterPage() {
  const [formData, setFormData] = useState({
    reg_no: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    year: '',
    semester: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register } = useAuth();
  const router = useRouter();

  const yearOptions = [
    { value: '', label: 'Select Year' },
    { value: '1', label: '1st Year' },
    { value: '2', label: '2nd Year' },
    { value: '3', label: '3rd Year' },
    { value: '4', label: '4th Year' },
  ];

  const getSemesterOptions = () => {
    const year = parseInt(formData.year);
    if (!year) return [{ value: '', label: 'Select Semester' }];
    
    const startSem = (year - 1) * 2 + 1;
    const endSem = year * 2;
    
    return [
      { value: '', label: 'Select Semester' },
      { value: startSem.toString(), label: `${startSem}${startSem === 1 ? 'st' : startSem === 2 ? 'nd' : startSem === 3 ? 'rd' : 'th'} Semester` },
      { value: endSem.toString(), label: `${endSem}${endSem === 2 ? 'nd' : endSem === 4 ? 'th' : endSem === 6 ? 'th' : 'th'} Semester` },
    ];
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await register({
        reg_no: formData.reg_no,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        year: parseInt(formData.year),
        semester: parseInt(formData.semester),
      }, 'student');

      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/student/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset semester when year changes
      ...(name === 'year' && { semester: '' })
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <Card>
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <Image
                  src="/logo (1).png"
                  alt="College Logo"
                  width={800}
                  height={200}
                  className="h-auto max-h-20 w-auto"
                  priority
                />
              </div>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <GraduationCap className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Student Registration
              </h1>
              <p className="text-gray-600">
                Create your account to track attendance
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-error-50 border border-error-200 rounded-lg"
                >
                  <p className="text-error-700 text-sm">{error}</p>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-success-50 border border-success-200 rounded-lg"
                >
                  <p className="text-success-700 text-sm">{success}</p>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    name="reg_no"
                    placeholder="Registration Number (numbers only, e.g., 2021001)"
                    value={formData.reg_no}
                    onChange={handleChange}
                    required
                    className="pl-10"
                  />
                </div>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="pl-10"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  options={yearOptions}
                  required
                />

                <Select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  options={getSemesterOptions()}
                  required
                  disabled={!formData.year}
                />
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link
                  href="/student/login"
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
