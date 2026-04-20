# 🚀 Active Buddies - Startup Guide

## 📋 Prerequisites

- **Node.js**: v18+ (check with `node --version`)
- **npm**: v9+ (check with `npm --version`)
- **Git**: v2.30+ (check with `git --version`)
- **VS Code** or similar IDE

---

## 🔧 Initial Setup (First Time Only)

### Step 1: Clone the Repository
```bash
# Option A: If not already cloned
git clone https://github.com/tasoasteritopeleven/Active_Buddies_1.git
cd Active_Buddies_1

# Option B: If already cloned, update
cd c:\Users\anast\IdeaProjects\Active_Buddies_1
git pull origin main
```

### Step 2: Install Dependencies
```bash
# Clean install (recommended)
rm -r node_modules package-lock.json
npm install

# Or just update
npm install
```

### Step 3: Verify Installation
```bash
# Check Node.js version
node --version
# Expected: v18.0.0 or higher

# Check npm version
npm --version
# Expected: v9.0.0 or higher

# Check installed packages
npm list
# Should show all dependencies without errors
```

---

## 🎯 Daily Development Workflow

### Start Development Server
```bash
# Navigate to project
cd c:\Users\anast\IdeaProjects\Active_Buddies_1

# Start dev server (port 3000)
npm run dev

# Output should show:
# VITE v6.2.0  ready in 123 ms
# ➜  Local:   http://localhost:3000/
# ➜  press h to show help
```

**Access the app**: Open browser to `http://localhost:3000`

### Type Checking
```bash
# In another terminal, check TypeScript errors
npm run lint

# Expected output:
# ✓ No errors found (after fixes)
```

### Build for Production
```bash
# Create optimized build
npm run build

# Output should show:
# ✓ 1234 modules transformed
# dist/index.html  12.34 kB
# dist/assets/...  456.78 kB
```

### Preview Production Build
```bash
# Preview the production build locally
npm run preview

# Access at: http://localhost:4173
```

---

## 📁 Project Structure

```
Active_Buddies_1/
├── src/
│   ├── pages/              # 16 page components
│   ├── components/         # UI components
│   ├── contexts/           # React contexts
│   ├── services/           # API service
│   ├── types/              # TypeScript types
│   ├── lib/                # Utilities
│   ├── data/               # Mock data (NEW)
│   ├── constants/          # Constants (NEW)
│   ├── App.tsx             # Main app
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
│
├── public/                 # Static assets
├── components/             # Root level (DUPLICATE - TO DELETE)
├── lib/                    # Root level (DUPLICATE - TO DELETE)
│
├── package.json            # Dependencies
├── vite.config.ts          # Vite config
├── tsconfig.json           # TypeScript config
├── tailwind.config.js      # Tailwind config
├── index.html              # HTML entry
├── .env.example            # Environment template
├── README.md               # Documentation
└── STARTUP_GUIDE.md        # This file
```

---

## 🔍 Troubleshooting

### Issue: Port 3000 Already in Use
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 3001
```

### Issue: npm install Fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -r node_modules package-lock.json

# Reinstall
npm install
```

### Issue: TypeScript Errors
```bash
# Check for errors
npm run lint

# Fix common issues
# 1. Update imports to use src/ prefix
# 2. Add type annotations
# 3. Remove unused variables
```

### Issue: Vite Build Fails
```bash
# Clean build
npm run clean
npm run build

# Check for errors in console
# Look for red error messages
```

### Issue: Module Not Found
```bash
# Check if file exists
ls src/components/ui/button.tsx

# Check imports in file
grep -r "from.*button" src/

# Update imports to correct path
```

---

## 📝 Environment Variables

### Create .env File
```bash
# Copy example
cp .env.example .env

# Edit .env with your values
nano .env
```

### Required Variables
```env
VITE_GEMINI_API_KEY=your_api_key_here
VITE_APP_URL=http://localhost:3000
```

---

## 🧪 Testing

### Run Type Checking
```bash
npm run lint
```

### Build and Test
```bash
npm run build
npm run preview
```

### Manual Testing
1. Open `http://localhost:3000` in browser
2. Test login/signup flow
3. Test navigation
4. Test responsive design (F12 → Device Toolbar)
5. Check console for errors (F12 → Console)

---

## 🔄 Git Workflow

### Check Status
```bash
git status
```

### Create Feature Branch
```bash
git checkout -b feature/quick-win-1
```

### Commit Changes
```bash
git add .
git commit -m "feat: remove unused dependencies"
```

### Push to Remote
```bash
git push origin feature/quick-win-1
```

### Create Pull Request
```bash
# Go to GitHub and create PR from feature branch to main
```

---

## 📊 Development Commands Summary

| Command | Purpose | Port |
|---------|---------|------|
| `npm run dev` | Start dev server | 3000 |
| `npm run build` | Build for production | - |
| `npm run preview` | Preview production build | 4173 |
| `npm run lint` | Check TypeScript errors | - |
| `npm run clean` | Clean dist folder | - |

---

## 🎯 Quick Start (TL;DR)

```bash
# 1. Navigate to project
cd c:\Users\anast\IdeaProjects\Active_Buddies_1

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open browser
# http://localhost:3000

# 5. In another terminal, check types
npm run lint

# 6. Make changes and see live reload
# (Changes to src/ files auto-reload)
```

---

## 📚 Additional Resources

- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev
- **TypeScript Docs**: https://www.typescriptlang.org
- **Tailwind CSS**: https://tailwindcss.com
- **shadcn/ui**: https://ui.shadcn.com

---

## 🆘 Need Help?

1. Check the **IMPLEMENTATION_PROGRESS.md** for current status
2. Read the **ACTIVE_BUDDIES_COMPREHENSIVE_ANALYSIS.md** for project overview
3. Check **ACTIVE_BUDDIES_QUICK_WINS_DETAILED.md** for specific task help
4. Review error messages in console (F12)
5. Check **STARTUP_GUIDE.md** troubleshooting section

---

**Last Updated**: April 17, 2026  
**Status**: Ready for Development  
**Next Step**: Run `npm install` and `npm run dev`
