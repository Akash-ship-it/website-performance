# Perfex Pro - Advanced Performance Analyzer

A professional website performance analysis tool powered by Perfex Performance Engine. Built with Next.js for optimal performance and user experience.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Core Web Vitals Analysis**: LCP, INP, CLS, FCP, and more
- **Mobile vs Desktop Comparison**: Side-by-side performance analysis
- **Competitor Benchmarking**: Compare multiple websites simultaneously
- **Advanced Visualizations**: Charts, radar graphs, and waterfall diagrams
- **Export Options**: PDF, CSV, and JSON reports
- **Accessibility & SEO Analysis**: Comprehensive website optimization insights
- **Historical Tracking**: Monitor performance improvements over time
- **Professional Reporting**: Enterprise-grade performance analysis

## Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI Components**: Shadcn UI, Tailwind CSS
- **Charts**: Recharts for data visualization
- **PDF Generation**: jsPDF for professional reports
- **Performance Engine**: Perfex Performance Engine

## Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_PAGESPEED_API_KEY=your_google_pagespeed_api_key_here
   ```

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

4. **Open Browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Features Overview

### 🚀 **Core Performance Analysis**
- **Core Web Vitals**: LCP, INP, CLS, FCP, Speed Index, TBT
- **Performance Scores**: Performance, Accessibility, Best Practices, SEO
- **Resource Analysis**: Image, script, and stylesheet optimization insights

### 📱 **Advanced Capabilities**
- **Mobile vs Desktop Comparison**: Side-by-side analysis
- **Competitor Benchmarking**: Multi-URL performance comparison
- **Historical Tracking**: Performance trends over time
- **Export Options**: PDF, CSV, and JSON reports

### 🎯 **Professional Tools**
- **Fix Guides**: Actionable optimization recommendations
- **Implementation Tracking**: Mark opportunities as implemented
- **Visual Analytics**: Charts, radar graphs, waterfall diagrams
- **Accessibility & SEO**: Deep-dive analysis tabs

## API Integration

This application integrates with Google PageSpeed Insights API to provide real performance data. The API calls are branded as "Perfex Performance Engine" for commercial use.

## Deployment

### **Vercel (Recommended)**
```bash
npm run build
vercel --prod
```

### **Other Platforms**
```bash
npm run build
npm start
```

## Customization

- **Branding**: Update colors, logos, and company information
- **API Endpoints**: Modify API integration points
- **UI Components**: Customize using Shadcn UI components
- **Export Formats**: Extend PDF and CSV generation

## Support

For support and feature requests, please contact the Perfex team.

---

**Built with ❤️ using Next.js, React, and TypeScript**
