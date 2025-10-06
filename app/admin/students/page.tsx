'use client';

import { withAuth } from '../../../lib/auth';
import StudentHistory from '../../../components/StudentHistory';

function AdminStudentsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
              <p className="text-gray-600">Comprehensive student history and analytics</p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/admin"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentHistory />
      </div>
    </div>
  );
}

export default withAuth(AdminStudentsPage, ['admin']);
