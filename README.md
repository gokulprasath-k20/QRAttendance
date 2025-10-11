# OTP Attendance Management System

A modern, secure, and mobile-first OTP Attendance Management System built with Next.js 15, TypeScript, Supabase, and Tailwind CSS. Features auto-rotating OTP codes, PWA support, and role-based access for Admin, Staff, and Students.

## 🚀 Features

> **Build Status**: Import paths fixed for Vercel deployment

- **🔐 Security & Authentication**
  - 8-second OTP code rotation with AES encrypted tokens
  - Role-based access control (Admin, Staff, Student)
  - Session-based authentication with Supabase Auth
  - Duplicate attendance prevention mechanisms

- **📱 Progressive Web App (PWA)**
  - Installable PWA with offline capability
  - OTP input interface for attendance marking
  - Touch-optimized interface for mobile devices
  - Native app experience on all platforms

- **🎨 Modern UI/UX**
  - Lavender SaaS theme with CSS custom properties
  - Framer Motion animations for smooth interactions
  - Responsive design (mobile-first approach)
  - Skeleton loading states and accessibility compliance

- **📊 Comprehensive Management**
  - Real-time attendance tracking with live updates
  - Advanced filtering & search capabilities
  - Excel/PDF export functionality
  - Detailed analytics & reports with charts

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS 4, Framer Motion
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with custom role-based system
- **Database**: PostgreSQL with Row Level Security
- **OTP System**: 6-digit OTP generation and validation
- **Security**: crypto-js for AES encryption
- **PWA**: Service Worker, Web App Manifest

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- Modern web browser with keyboard input support

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd qrmanagement
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Copy the environment example file:

```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OTP Code Encryption (32 characters)
NEXT_PUBLIC_OTP_SECRET=your_32_character_encryption_secret_key

# Admin Credentials
ADMIN_EMAIL=admin@college.edu
ADMIN_PASSWORD=admin123

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Run the SQL script to create all tables, indexes, and policies

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 User Roles & Access

### 🎓 Student Portal (`/student`)
- **Registration**: Registration number, name, email, year, semester
- **Login**: Email and password authentication
- **OTP Entry**: 6-digit OTP code input for attendance marking
- **Attendance History**: View past attendance records
- **Statistics**: Track attendance percentage and analytics

### 👨‍🏫 Staff Portal (`/staff`)
- **Registration**: Name, email, subjects selection
- **Login**: Email and password authentication
- **Session Management**: Create and manage attendance sessions
- **OTP Generation**: Auto-rotating encrypted OTP codes (8-second intervals)
- **Live Monitoring**: Real-time attendance tracking
- **Reports**: Export attendance data

### 👨‍💼 Admin Portal (`/admin`)
- **Login**: admin@college.edu / admin123 (default)
- **Dashboard**: System overview and statistics
- **User Management**: View all users and their data
- **Reports**: Comprehensive attendance reports and analytics
- **Export**: Excel/PDF generation for all data

## 🏗️ Project Structure

```
qrmanagement/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── sessions/      # OTP session management
│   │   └── attendance/    # Attendance marking
│   ├── admin/             # Admin portal pages
│   ├── staff/             # Staff portal pages
│   ├── student/           # Student portal pages
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # Basic UI components
│   ├── OTPGenerator.tsx  # OTP code generation
│   └── OTPInput.tsx      # OTP code input interface
├── lib/                  # Utility libraries
│   ├── auth.tsx          # Authentication context
│   ├── crypto.ts         # Encryption utilities
│   ├── supabase.ts       # Database client
│   └── utils.ts          # Helper functions
├── types/                # TypeScript type definitions
├── database/             # Database schema and migrations
└── public/               # Static assets and PWA files
```

## 🔒 Security Features

### OTP Code Security
- **AES Encryption**: All OTP tokens are encrypted using AES-256
- **Time-based Expiry**: OTP codes expire after 8 seconds
- **Session Validation**: Tokens include session metadata for validation
- **Duplicate Prevention**: Students cannot mark attendance twice for the same session

### Authentication Security
- **Password Hashing**: Passwords are hashed using SHA-256 with salt
- **Session Management**: HTTP-only cookies with secure flags
- **Role-based Access**: Strict role validation on all endpoints
- **Row Level Security**: Database-level security policies

## 📊 Academic Structure

The system supports a 4-year engineering program structure:

- **Year 1**: Semesters 1-2 (Foundation courses)
- **Year 2**: Semesters 3-4 (Core engineering subjects)
- **Year 3**: Semesters 5-6 (Specialization subjects)
- **Year 4**: Semesters 7-8 (Advanced topics and projects)

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Adding New Features

1. **Database Changes**: Update `database/schema.sql`
2. **API Routes**: Add endpoints in `app/api/`
3. **Types**: Update type definitions in `types/`
4. **Components**: Create reusable components in `components/`
5. **Pages**: Add new pages in appropriate role directories

## 📱 PWA Installation

The app can be installed as a Progressive Web App:

1. **Desktop**: Click the install button in the address bar
2. **Mobile**: Use "Add to Home Screen" from the browser menu
3. **Features**: Works offline, native app experience, push notifications ready

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

The app can be deployed on:
- **Netlify**: Static site with serverless functions
- **Railway**: Full-stack deployment
- **Docker**: Containerized deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the database schema in `database/schema.sql`

## 🎯 Roadmap

- [ ] Push notifications for attendance reminders
- [ ] Biometric authentication integration
- [ ] Advanced analytics with charts
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Bulk user import/export
- [ ] Integration with LMS systems
- [ ] Mobile app (React Native)

---

Built with ❤️ using Next.js 15, TypeScript, and Supabase.
