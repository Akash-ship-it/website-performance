"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBarChart,
  RadialBar,
} from "recharts";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Download,
  Globe,
  Smartphone,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Eye,
  TrendingUp,
  FileImage,
  Code,
  Palette,
  Star,
  Target,
  ArrowRight,
  Play,
  BarChart3,
  Activity,
  Gauge,
  Sparkles,
  Shield,
  Rocket,
  Crown,
  Award,
  ChevronDown,
  ExternalLink,
  Settings,
  RefreshCw,
  Info,
} from "lucide-react";
import Image from "next/image";

interface PageSpeedMetrics {
  url: string;
  timestamp: number;
  device: "desktop" | "mobile";
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  metrics: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
    speedIndex: number;
    totalBlockingTime: number;
    interactionToNextPaint: number;
  };
  opportunities: Array<{
    id: string;
    title: string;
    description: string;
    savings: number;
    displayValue: string;
  }>;
  diagnostics: Array<{
    id: string;
    title: string;
    description: string;
    displayValue: string;
  }>;
  resourceSummary: {
    totalSize: number;
    imageSize: number;
    scriptSize: number;
    stylesheetSize: number;
    resourceCount: number;
  };
  networkRequests?: Array<{
    url: string;
    transferSize: number;
    startTime: number;
    endTime: number;
    resourceType?: string;
  }>;
  screenshots?: {
    thumbnails: string[];
    final?: string | null;
  };
  loadingExperience?: {
    overall_category: string;
    metrics: {
      CUMULATIVE_LAYOUT_SHIFT_SCORE?: { category: string; percentile: number };
      FIRST_CONTENTFUL_PAINT_MS?: { category: string; percentile: number };
      FIRST_INPUT_DELAY_MS?: { category: string; percentile: number };
      LARGEST_CONTENTFUL_PAINT_MS?: { category: string; percentile: number };
      INTERACTION_TO_NEXT_PAINT_MS?: { category: string; percentile: number };
    };
  };
  accessibilityFindings?: Array<{
    id: string;
    title: string;
    description?: string;
    displayValue?: string;
  }>;
  seoFindings?: Array<{
    id: string;
    title: string;
    description?: string;
    displayValue?: string;
  }>;
}

interface ScoreData {
  name: string;
  score: number;
  color: string;
  category: string;
}

interface MetricCard {
  title: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
  trend: "up" | "down" | "neutral";
  color: string;
  description: string;
}

const GradientBackground = () => (
  <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pointer-events-none">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
    <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02] bg-[size:50px_50px]" />
  </div>
);

export default function AccuratePerformanceAnalyzer() {
  const [url, setUrl] = useState("");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<PageSpeedMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PageSpeedMetrics[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [desktopResults, setDesktopResults] = useState<PageSpeedMetrics | null>(
    null
  );
  const [mobileResults, setMobileResults] = useState<PageSpeedMetrics | null>(
    null
  );
  const [benchmarkUrls, setBenchmarkUrls] = useState<string[]>(["", "", ""]);
  const [benchmarkResults, setBenchmarkResults] = useState<PageSpeedMetrics[]>(
    []
  );
  const [implementedOpportunities, setImplementedOpportunities] = useState<
    Set<string>
  >(new Set());

  const [lastAnalyzedUrl, setLastAnalyzedUrl] = useState<string>("");
  const [lastAnalyzedDevice, setLastAnalyzedDevice] = useState<
    "desktop" | "mobile" | null
  >(null);

  const analysisCacheRef = useRef<Map<string, PageSpeedMetrics>>(new Map());

  const PAGESPEED_API_KEY = process.env.NEXT_PUBLIC_PAGESPEED_API_KEY || ""; // Add your API key here
  const PAGESPEED_API_BASE =
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

  // Load history and implemented opportunities from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("perfex-history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error("Failed to parse saved history:", error);
      }
    }

    const savedOpportunities = localStorage.getItem(
      "perfex-implemented-opportunities"
    );
    if (savedOpportunities) {
      try {
        setImplementedOpportunities(new Set(JSON.parse(savedOpportunities)));
      } catch (error) {
        console.error("Failed to parse saved opportunities:", error);
      }
    }
  }, []);

  // Auto-analyze when device changes (only if we have results for a different device)
  useEffect(() => {
    if (results && url && lastAnalyzedUrl && lastAnalyzedDevice) {
      // Check if we have results but for a different device
      if (device !== lastAnalyzedDevice && url === lastAnalyzedUrl) {
        analyzeWebsite();
      }
    }
  }, [device]);

  // Handle device change
  const handleDeviceChange = (newDevice: "desktop" | "mobile") => {
    setDevice(newDevice);
    // The useEffect above will handle auto-analysis if needed
  };

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("perfex-history", JSON.stringify(history));
    }
  }, [history]);

  // Save implemented opportunities to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      "perfex-implemented-opportunities",
      JSON.stringify(Array.from(implementedOpportunities))
    );
  }, [implementedOpportunities]);

  const analyzeWebsite = async () => {
    if (!url) return;

    setIsAnalyzing(true);
    setError(null);
    setProgress(0);
    setCurrentStep(
      compareMode
        ? "Initializing dual-device analysis..."
        : "Initializing Perfex analysis..."
    );

    try {
      const testUrl = url.startsWith("http") ? url : `https://${url}`;
      new URL(testUrl);

      setProgress(15);
      setCurrentStep(
        compareMode
          ? "Connecting to Perfex Performance Engine..."
          : "Connecting to Perfex Performance Engine..."
      );

      if (compareMode) {
        // Run both desktop and mobile analysis
        setCurrentStep("Running desktop analysis...");
        const desktopData = await runSingleAnalysis(testUrl, "desktop");
        setProgress(50);

        setCurrentStep("Running mobile analysis...");
        const mobileData = await runSingleAnalysis(testUrl, "mobile");
        setProgress(85);

        setCurrentStep("Processing comparison results...");
        setDesktopResults(desktopData);
        setMobileResults(mobileData);
        setResults(desktopData); // Set main results to desktop for compatibility
        setHistory((prev) => [desktopData, mobileData, ...prev.slice(0, 8)]);
      } else {
        // Run single device analysis
        const strategy = device === "mobile" ? "mobile" : "desktop";
        const analysisResults = await runSingleAnalysis(testUrl, strategy);
        setResults(analysisResults);
        setHistory((prev) => [analysisResults, ...prev.slice(0, 9)]);

        // Track the last analyzed URL and device
        setLastAnalyzedUrl(testUrl);
        setLastAnalyzedDevice(strategy);
      }

      setProgress(100);
      setCurrentStep("Analysis complete - real data ready!");

      setTimeout(() => {
        setIsAnalyzing(false);
        setProgress(0);
        setCurrentStep("");
      }, 500);
    } catch (err: any) {
      console.error("Perfex analysis error:", err);
      let errorMessage = "Analysis failed. Please check the URL and try again.";

      if (err.message.includes("PageSpeed API Error")) {
        errorMessage =
          "Perfex Performance Engine is currently unavailable. Please try again later.";
      } else if (err.message.includes("Invalid URL")) {
        errorMessage = "Please enter a valid URL (e.g., https://example.com)";
      } else if (err.message.includes("Network")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
      setCurrentStep("");
    }
  };

  const runSingleAnalysis = async (
    testUrl: string,
    strategy: "desktop" | "mobile"
  ): Promise<PageSpeedMetrics> => {
    const cacheKey = `${testUrl}|${strategy}`;
    const cached = analysisCacheRef.current.get(cacheKey);
    if (cached) {
      return cached;
    }
    const apiUrl = `${PAGESPEED_API_BASE}?url=${encodeURIComponent(
      testUrl
    )}&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo${
      PAGESPEED_API_KEY ? `&key=${PAGESPEED_API_KEY}` : ""
    }`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(
        `PageSpeed API Error: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Perfex Analysis Failed: ${data.error.message}`);
    }

    // Extract metrics from Perfex response
    const lighthouseResult = data.lighthouseResult;
    const categories = lighthouseResult.categories;
    const audits = lighthouseResult.audits;

    // Core Web Vitals and other metrics
    const metrics = {
      firstContentfulPaint: audits["first-contentful-paint"]?.numericValue || 0,
      largestContentfulPaint:
        audits["largest-contentful-paint"]?.numericValue || 0,
      firstInputDelay: audits["max-potential-fid"]?.numericValue || 0,
      interactionToNextPaint:
        audits["interaction-to-next-paint"]?.numericValue || 0,
      cumulativeLayoutShift:
        audits["cumulative-layout-shift"]?.numericValue || 0,
      speedIndex: audits["speed-index"]?.numericValue || 0,
      totalBlockingTime: audits["total-blocking-time"]?.numericValue || 0,
    };

    // Performance optimization opportunities
    const opportunities = Object.entries(audits)
      .filter(
        ([key, audit]: [string, any]) =>
          audit.scoreDisplayMode === "numeric" &&
          audit.numericValue > 0 &&
          audit.details?.overallSavingsMs > 100
      )
      .map(([key, audit]: [string, any]) => ({
        id: key,
        title: audit.title,
        description: audit.description,
        savings: audit.details?.overallSavingsMs || 0,
        displayValue: audit.displayValue || "",
      }))
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 10);

    // Diagnostics
    const diagnostics = Object.entries(audits)
      .filter(
        ([key, audit]: [string, any]) =>
          audit.scoreDisplayMode === "informative" && audit.displayValue
      )
      .map(([key, audit]: [string, any]) => ({
        id: key,
        title: audit.title,
        description: audit.description,
        displayValue: audit.displayValue,
      }))
      .slice(0, 8);

    // Resource summary
    const resourceSummary = {
      totalSize:
        audits["resource-summary"]?.details?.items?.reduce(
          (sum: number, item: any) => sum + (item.size || 0),
          0
        ) || 0,
      imageSize:
        audits["resource-summary"]?.details?.items?.find(
          (item: any) => item.resourceType === "image"
        )?.size || 0,
      scriptSize:
        audits["resource-summary"]?.details?.items?.find(
          (item: any) => item.resourceType === "script"
        )?.size || 0,
      stylesheetSize:
        audits["resource-summary"]?.details?.items?.find(
          (item: any) => item.resourceType === "stylesheet"
        )?.size || 0,
      resourceCount:
        audits["resource-summary"]?.details?.items?.reduce(
          (sum: number, item: any) => sum + (item.requestCount || 0),
          0
        ) || 0,
    };

    // Network requests for waterfall
    const networkRequests = (
      audits["network-requests"]?.details?.items || []
    ).map((item: any) => ({
      url: item.url,
      transferSize: item.transferSize || item.resourceSize || 0,
      startTime: item.startTimeMs ?? item.startTime ?? 0,
      endTime:
        item.endTimeMs ??
        item.endTime ??
        (item.startTimeMs ?? item.startTime ?? 0) +
          (item.durationMs ?? item.duration ?? 0),
      resourceType: item.resourceType,
    }));

    // Screenshot thumbnails and final screenshot
    const thumbnails = (audits["screenshot-thumbnails"]?.details?.items || [])
      .map((it: any) => it.data)
      .filter(Boolean);
    const finalScreenshot = audits["final-screenshot"]?.details?.data || null;

    const result: PageSpeedMetrics = {
      url: testUrl,
      timestamp: Date.now(),
      device: strategy,
      scores: {
        performance: Math.round(categories.performance.score * 100),
        accessibility: Math.round(categories.accessibility.score * 100),
        bestPractices: Math.round(categories["best-practices"].score * 100),
        seo: Math.round(categories.seo.score * 100),
      },
      metrics,
      opportunities,
      diagnostics,
      resourceSummary,
      loadingExperience: data.loadingExperience,
      networkRequests,
      screenshots: { thumbnails, final: finalScreenshot },
    };
    analysisCacheRef.current.set(cacheKey, result);
    return result;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return "rgb(34, 197, 94)"; // emerald-500
    if (score >= 50) return "rgb(245, 158, 11)"; // amber-500
    return "rgb(239, 68, 68)"; // red-500
  };

  const getScoreGradient = (score: number): string => {
    if (score >= 90) return "from-emerald-500 to-green-400";
    if (score >= 50) return "from-amber-500 to-yellow-400";
    return "from-red-500 to-pink-400";
  };

  const getPerformanceScores = (): ScoreData[] => {
    if (!results) return [];

    return [
      {
        name: "Performance",
        score: results.scores.performance,
        color: getScoreColor(results.scores.performance),
        category: "Core Vitals",
      },
      {
        name: "Accessibility",
        score: results.scores.accessibility,
        color: getScoreColor(results.scores.accessibility),
        category: "User Experience",
      },
      {
        name: "Best Practices",
        score: results.scores.bestPractices,
        color: getScoreColor(results.scores.bestPractices),
        category: "Standards",
      },
      {
        name: "SEO",
        score: results.scores.seo,
        color: getScoreColor(results.scores.seo),
        category: "Search",
      },
    ];
  };

  const getMetricCards = (): MetricCard[] => {
    if (!results) return [];

    return [
      {
        title: "First Contentful Paint",
        value: formatTime(results.metrics.firstContentfulPaint),
        icon: <Eye className="h-5 w-5" />,
        trend:
          results.metrics.firstContentfulPaint <= 1800
            ? "up"
            : results.metrics.firstContentfulPaint <= 3000
            ? "neutral"
            : "down",
        color:
          results.metrics.firstContentfulPaint <= 1800
            ? "text-emerald-400"
            : results.metrics.firstContentfulPaint <= 3000
            ? "text-amber-400"
            : "text-red-400",
        description: "Time when first text/image appears",
      },
      {
        title: "Largest Contentful Paint",
        value: formatTime(results.metrics.largestContentfulPaint),
        icon: <Rocket className="h-5 w-5" />,
        trend:
          results.metrics.largestContentfulPaint <= 2500
            ? "up"
            : results.metrics.largestContentfulPaint <= 4000
            ? "neutral"
            : "down",
        color:
          results.metrics.largestContentfulPaint <= 2500
            ? "text-emerald-400"
            : results.metrics.largestContentfulPaint <= 4000
            ? "text-amber-400"
            : "text-red-400",
        description: "Time when main content finishes loading",
      },
      {
        title: "Interaction to Next Paint",
        value: formatTime(results.metrics.interactionToNextPaint || 0),
        icon: <Zap className="h-5 w-5" />,
        trend:
          (results.metrics.interactionToNextPaint || 0) < 200
            ? "up"
            : (results.metrics.interactionToNextPaint || 0) <= 500
            ? "neutral"
            : "down",
        color:
          (results.metrics.interactionToNextPaint || 0) < 200
            ? "text-emerald-400"
            : (results.metrics.interactionToNextPaint || 0) <= 500
            ? "text-amber-400"
            : "text-red-400",
        description: "Interactivity latency for real user inputs",
      },
      {
        title: "Speed Index",
        value: formatTime(results.metrics.speedIndex),
        icon: <Activity className="h-5 w-5" />,
        trend:
          results.metrics.speedIndex <= 3400
            ? "up"
            : results.metrics.speedIndex <= 5800
            ? "neutral"
            : "down",
        color:
          results.metrics.speedIndex <= 3400
            ? "text-emerald-400"
            : results.metrics.speedIndex <= 5800
            ? "text-amber-400"
            : "text-red-400",
        description: "How quickly content is visually displayed",
      },
      {
        title: "Cumulative Layout Shift",
        value: results.metrics.cumulativeLayoutShift.toFixed(3),
        icon: <BarChart3 className="h-5 w-5" />,
        trend:
          results.metrics.cumulativeLayoutShift <= 0.1
            ? "up"
            : results.metrics.cumulativeLayoutShift <= 0.25
            ? "neutral"
            : "down",
        color:
          results.metrics.cumulativeLayoutShift <= 0.1
            ? "text-emerald-400"
            : results.metrics.cumulativeLayoutShift <= 0.25
            ? "text-amber-400"
            : "text-red-400",
        description: "Visual stability during page load",
      },
    ];
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const exportResults = () => {
    if (!results) return;

    const exportData = {
      ...results,
      exportedAt: new Date().toISOString(),
      performanceScores: getPerformanceScores(),
      coreWebVitals: {
        fcp: results.metrics.firstContentfulPaint,
        lcp: results.metrics.largestContentfulPaint,
        fid: results.metrics.firstInputDelay,
        inp: results.metrics.interactionToNextPaint,
        cls: results.metrics.cumulativeLayoutShift,
      },
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `perfex-performance-report-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportHistoryCSV = () => {
    if (history.length === 0) return;

    const headers = [
      "Date",
      "Device",
      "Performance Score",
      "Accessibility Score",
      "Best Practices Score",
      "SEO Score",
      "FCP (ms)",
      "LCP (ms)",
      "INP (ms)",
      "CLS",
      "Speed Index (ms)",
      "Total Blocking Time (ms)",
    ];

    const csvData = history.map((record) => [
      new Date(record.timestamp).toLocaleDateString(),
      record.device,
      record.scores.performance,
      record.scores.accessibility,
      record.scores.bestPractices,
      record.scores.seo,
      record.metrics.firstContentfulPaint,
      record.metrics.largestContentfulPaint,
      record.metrics.interactionToNextPaint || 0,
      record.metrics.cumulativeLayoutShift,
      record.metrics.speedIndex,
      record.metrics.totalBlockingTime,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `perfex-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!results) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = 20;

    // Title
    doc.setFontSize(24);
    doc.setTextColor(33, 33, 33);
    doc.text("Perfex Performance Report", margin, yPosition);
    yPosition += 15;

    // URL and Date
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`URL: ${results.url}`, margin, yPosition);
    yPosition += 8;
    doc.text(
      `Analysis Date: ${new Date(results.timestamp).toLocaleDateString()}`,
      margin,
      yPosition
    );
    yPosition += 8;
    doc.text(`Device: ${results.device}`, margin, yPosition);
    yPosition += 20;

    // Performance Scores
    doc.setFontSize(16);
    doc.setTextColor(33, 33, 33);
    doc.text("Performance Scores", margin, yPosition);
    yPosition += 10;

    const scores = [
      { name: "Performance", score: results.scores.performance },
      { name: "Accessibility", score: results.scores.accessibility },
      { name: "Best Practices", score: results.scores.bestPractices },
      { name: "SEO", score: results.scores.seo },
    ];

    scores.forEach((score) => {
      doc.setFontSize(12);
      doc.setTextColor(33, 33, 33);
      doc.text(`${score.name}:`, margin, yPosition);
      doc.setTextColor(
        score.score >= 90 ? 34 : score.score >= 50 ? 245 : 239,
        score.score >= 90 ? 197 : score.score >= 50 ? 158 : 68,
        score.score >= 90 ? 94 : score.score >= 50 ? 11 : 68
      );
      doc.text(`${score.score}/100`, margin + 80, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Core Web Vitals
    doc.setFontSize(16);
    doc.setTextColor(33, 33, 33);
    doc.text("Core Web Vitals", margin, yPosition);
    yPosition += 10;

    const vitals = [
      {
        name: "LCP",
        value: formatTime(results.metrics.largestContentfulPaint),
        threshold: "Good: < 2.5s",
      },
      {
        name: "INP",
        value: formatTime(results.metrics.interactionToNextPaint || 0),
        threshold: "Good: < 200ms",
      },
      {
        name: "CLS",
        value: results.metrics.cumulativeLayoutShift.toFixed(3),
        threshold: "Good: < 0.1",
      },
      {
        name: "FCP",
        value: formatTime(results.metrics.firstContentfulPaint),
        threshold: "Good: < 1.8s",
      },
    ];

    vitals.forEach((vital) => {
      doc.setFontSize(12);
      doc.setTextColor(33, 33, 33);
      doc.text(`${vital.name}: ${vital.value}`, margin, yPosition);
      doc.setTextColor(100, 100, 100);
      doc.text(vital.threshold, margin + 80, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Opportunities
    if (results.opportunities.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(33, 33, 33);
      doc.text("Optimization Opportunities", margin, yPosition);
      yPosition += 10;

      results.opportunities.slice(0, 5).forEach((opportunity) => {
        doc.setFontSize(11);
        doc.setTextColor(33, 33, 33);
        doc.text(opportunity.title, margin, yPosition);
        yPosition += 6;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Potential savings: ${formatTime(opportunity.savings)}`,
          margin + 10,
          yPosition
        );
        yPosition += 6;
      });
    }

    // Save PDF
    doc.save(
      `perfex-performance-report-${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const performanceScores = useMemo(() => getPerformanceScores(), [results]);
  const overallScore =
    performanceScores.length > 0
      ? Math.round(
          performanceScores.reduce((sum, score) => sum + score.score, 0) /
            performanceScores.length
        )
      : 0;
  const metricCards = useMemo(() => getMetricCards(), [results]);

  const resourceData = useMemo(() => {
    if (!results)
      return [] as Array<{ name: string; value: number; color: string }>;
    const parts = [
      {
        name: "Images",
        value: results.resourceSummary.imageSize,
        color: "#8b5cf6",
      },
      {
        name: "Scripts",
        value: results.resourceSummary.scriptSize,
        color: "#06b6d4",
      },
      {
        name: "Styles",
        value: results.resourceSummary.stylesheetSize,
        color: "#10b981",
      },
    ];
    const otherValue = Math.max(
      0,
      results.resourceSummary.totalSize - parts.reduce((s, p) => s + p.value, 0)
    );
    if (otherValue > 0)
      parts.push({ name: "Other", value: otherValue, color: "#f59e0b" });
    return parts.filter((item) => item.value > 0);
  }, [results]);

  const networkBarData = useMemo(() => {
    if (!results?.networkRequests)
      return [] as Array<{
        name: string;
        start: number;
        duration: number;
        size: number;
      }>;
    try {
      return results.networkRequests.slice(0, 40).map((r) => ({
        name: new URL(r.url).hostname.replace(/^www\./, ""),
        start: r.startTime,
        duration: Math.max(0, r.endTime - r.startTime),
        size: r.transferSize,
      }));
    } catch {
      return [] as Array<{
        name: string;
        start: number;
        duration: number;
        size: number;
      }>;
    }
  }, [results?.networkRequests]);

  const radialData = performanceScores.map((score) => ({
    ...score,
    fill: score.color,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <GradientBackground />

      {/* Header */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-6 py-3 shadow-2xl shadow-purple-500/10">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Perfex Pro
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <Badge
                variant="secondary"
                className="bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30"
              >
                <Shield className="h-3 w-3 mr-1" />
                Perfex Engine
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-full px-4 py-2 mb-8">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-sm text-green-300 font-medium">
              Project #3 By <strong> Akash More</strong>
            </span>
          </div>

          <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              Perfex Performance
            </span>
            <br />
            <span className="bg-gradient-to-r from-green-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Analyzer
            </span>
          </h2>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Get advanced performance data from Perfex's infrastructure. Analyze
            Core Web Vitals, accessibility, SEO, and get actionable optimization
            recommendations.
          </p>
        </div>

        {/* Analysis Interface */}
        <Card className="mb-12 bg-slate-900/50 backdrop-blur-xl border-slate-700/50 shadow-2xl shadow-purple-500/10">
          <CardContent className="p-8">
            <div className="space-y-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Gauge className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Perfex Performance Scanner
                  </h3>
                  <p className="text-slate-400">
                    Advanced performance data from Perfex servers
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7">
                  <div className="relative">
                    <Input
                      type="url"
                      placeholder="Enter target URL (e.g., https://example.com)"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="h-14 text-lg bg-slate-800/50 border-slate-600/50 focus:border-green-500 focus:ring-green-500/20 text-white placeholder-slate-400 pl-12"
                    />
                    <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <Select value={device} onValueChange={handleDeviceChange}>
                    <SelectTrigger className="h-14 bg-slate-800/50 border-slate-600/50 focus:border-green-500 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem
                        value="desktop"
                        className="focus:bg-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <Monitor className="h-4 w-4 text-blue-400" />
                          <span>Desktop</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="mobile" className="focus:bg-slate-700">
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-4 w-4 text-purple-400" />
                          <span>Mobile</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-2">
                  <Button
                    onClick={analyzeWebsite}
                    disabled={isAnalyzing || !url}
                    className="h-14 w-full bg-gradient-to-r from-green-600 via-blue-600 to-cyan-600 hover:from-green-700 hover:via-blue-700 hover:to-cyan-700 text-white border-0 font-semibold shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        {results &&
                        url === lastAnalyzedUrl &&
                        device !== lastAnalyzedDevice
                          ? `Analyze ${
                              device === "mobile" ? "Mobile" : "Desktop"
                            }`
                          : "Analyze"}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Comparison Mode Toggle */}
              {/* <div className="flex items-center space-x-3 pt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="compareMode"
                    checked={compareMode}
                    onChange={(e) => setCompareMode(e.target.checked)}
                    className="w-4 h-4 text-green-600 bg-slate-800 border-slate-600 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <label
                    htmlFor="compareMode"
                    className="text-sm text-slate-300"
                  >
                    Compare Mobile vs Desktop
                  </label>
                </div>
                {compareMode && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    <Monitor className="h-3 w-3 mr-1" />
                    <Smartphone className="h-3 w-3 mr-1" />
                    Dual Analysis
                  </Badge>
                )}
              </div> */}

              {/* Progress */}
              {isAnalyzing && (
                <div
                  className="space-y-4 bg-slate-800/30 rounded-xl p-6 border border-slate-700/30"
                  role="status"
                  aria-live="polite"
                  aria-busy={isAnalyzing}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center animate-pulse">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p
                          className="text-white font-medium"
                          aria-atomic="true"
                        >
                          {currentStep}
                        </p>
                        <p className="text-sm text-slate-400">
                          Perfex Performance Engine
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {progress}%
                      </p>
                      <p className="text-xs text-slate-400">Complete</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Progress value={progress} className="h-3 bg-slate-800" />
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-cyan-500/20 rounded-full" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-8 bg-red-500/10 border-red-500/30 text-red-300">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Results Dashboard */}
        {results && (
          <div className="space-y-8">
            {/* Performance Score Hero */}
            <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50 shadow-2xl shadow-green-500/10 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-cyan-500/10" />
                  <div className="relative p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <div className="flex items-center space-x-3 mb-4">
                          <Award className="h-6 w-6 text-yellow-400" />
                          <h3 className="text-2xl font-bold text-white">
                            Performance Score
                          </h3>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            Perfex Verified
                          </Badge>
                        </div>
                        <p className="text-slate-300">
                          Advanced performance data from Perfex infrastructure
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="relative">
                          <div
                            className={`text-7xl font-black mb-2 bg-gradient-to-r ${getScoreGradient(
                              results.scores.performance
                            )} bg-clip-text text-transparent`}
                          >
                            {results.scores.performance}
                          </div>
                          <div className="absolute -top-2 -right-6">
                            <Badge
                              className={`${
                                results.scores.performance >= 90
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                  : results.scores.performance >= 50
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                  : "bg-red-500/20 text-red-300 border-red-500/30"
                              } text-sm font-semibold`}
                            >
                              {results.scores.performance >= 90
                                ? "Fast"
                                : results.scores.performance >= 50
                                ? "Average"
                                : "Slow"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="flex items-center space-x-3 text-sm text-slate-300">
                        <Globe className="h-4 w-4 text-blue-400" />
                        <span className="truncate">
                          {results.url.replace(/^https?:\/\//, "")}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-sm text-slate-300">
                        {results.device === "desktop" ? (
                          <Monitor className="h-4 w-4 text-purple-400" />
                        ) : (
                          <Smartphone className="h-4 w-4 text-cyan-400" />
                        )}
                        <span>
                          {results.device === "desktop"
                            ? "Desktop Analysis"
                            : "Mobile Analysis"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-sm text-slate-300">
                        <Clock className="h-4 w-4 text-green-400" />
                        <span>
                          {new Date(results.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getScoreGradient(
                          results.scores.performance
                        )} transition-all duration-1000`}
                        style={{ width: `${results.scores.performance}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Core Web Vitals Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metricCards.map((metric, index) => (
                <Card
                  key={index}
                  className="bg-slate-900/50 backdrop-blur-xl border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`p-3 rounded-xl bg-slate-800/50 group-hover:bg-slate-700/50 transition-colors ${metric.color}`}
                      >
                        {metric.icon}
                      </div>
                      <div
                        className={`p-2 rounded-lg ${
                          metric.trend === "up"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : metric.trend === "down"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        <TrendingUp
                          className={`h-3 w-3 ${
                            metric.trend === "down"
                              ? "rotate-180"
                              : metric.trend === "neutral"
                              ? "rotate-90"
                              : ""
                          }`}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-white group-hover:text-slate-100 transition-colors">
                        {metric.value}
                      </p>
                      <p className="text-sm font-medium text-slate-300 group-hover:text-slate-200 transition-colors">
                        {metric.title}
                      </p>
                      <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                        {metric.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Advanced Analytics Dashboard */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/50 shadow-2xl">
              <Tabs defaultValue="overview" className="w-full">
                <div className="border-b border-slate-700/50 px-8 pt-6">
                  <TabsList className="grid w-full grid-cols-9 bg-slate-800/30 p-1 rounded-xl">
                    <TabsTrigger
                      value="overview"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-slate-300 rounded-lg"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Scores
                    </TabsTrigger>
                    <TabsTrigger
                      value="vitals"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-slate-300 rounded-lg"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Core Vitals
                    </TabsTrigger>
                    <TabsTrigger
                      value="field-vs-lab"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-slate-300 rounded-lg"
                    >
                      <Gauge className="h-4 w-4 mr-2" />
                      Field vs Lab
                    </TabsTrigger>
                    <TabsTrigger
                      value="benchmark"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-slate-300 rounded-lg"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Benchmark
                    </TabsTrigger>
                    <TabsTrigger
                      value="accessibility"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-slate-300 rounded-lg"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Accessibility
                    </TabsTrigger>
                    <TabsTrigger
                      value="seo"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-slate-300 rounded-lg"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      SEO
                    </TabsTrigger>
                    <TabsTrigger
                      value="opportunities"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-slate-300 rounded-lg"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Optimize
                    </TabsTrigger>
                    <TabsTrigger
                      value="diagnostics"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-slate-300 rounded-lg"
                    >
                      <Info className="h-4 w-4 mr-2" />
                      Diagnostics
                    </TabsTrigger>
                    <TabsTrigger
                      value="history"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-slate-300 rounded-lg"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      History
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="p-8 space-y-8">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* All Scores */}
                    <div className="space-y-6">
                      <h4 className="text-xl font-bold text-white flex items-center space-x-2">
                        <Award className="h-5 w-5 text-yellow-400" />
                        <span>All Categories</span>
                      </h4>

                      <div className="space-y-4">
                        {performanceScores.map((score, index) => (
                          <div
                            key={index}
                            className="bg-slate-800/30 rounded-xl p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-3 h-3 rounded-full`}
                                  style={{ backgroundColor: score.color }}
                                />
                                <div>
                                  <p className="font-semibold text-white">
                                    {score.name}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {score.category}
                                  </p>
                                </div>
                              </div>
                              <div className="text-3xl font-bold text-white">
                                {score.score}
                              </div>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-1000"
                                style={{
                                  width: `${score.score}%`,
                                  backgroundColor: score.color,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resource Breakdown */}
                    <div className="space-y-6">
                      <h4 className="text-xl font-bold text-white flex items-center space-x-2">
                        <FileImage className="h-5 w-5 text-purple-400" />
                        <span>Resource Analysis</span>
                      </h4>

                      {resourceData.length > 0 ? (
                        <div className="bg-slate-800/30 rounded-xl p-6">
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={resourceData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={120}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {resourceData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => [
                                  formatBytes(
                                    typeof value === "number"
                                      ? value
                                      : Number(value)
                                  ),
                                  "Size",
                                ]}
                                contentStyle={{
                                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                                  border: "1px solid rgba(148, 163, 184, 0.3)",
                                  borderRadius: "12px",
                                  color: "white",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="bg-slate-800/30 rounded-xl p-6 text-center">
                          <p className="text-slate-400">
                            No resource data available
                          </p>
                        </div>
                      )}

                      {/* Resource Waterfall */}
                      {results?.networkRequests &&
                        results.networkRequests.length > 0 && (
                          <div className="bg-slate-800/30 rounded-xl p-6">
                            <h5 className="text-white font-semibold mb-4">
                              Network Waterfall
                            </h5>
                            <ResponsiveContainer width="100%" height={280}>
                              <BarChart
                                data={networkBarData}
                                margin={{
                                  left: 0,
                                  right: 0,
                                  top: 10,
                                  bottom: 10,
                                }}
                              >
                                <XAxis
                                  dataKey="name"
                                  tick={false}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <Tooltip
                                  formatter={(
                                    value: any,
                                    key: any,
                                    item: any
                                  ) => {
                                    if (key === "duration")
                                      return [formatTime(value), "Duration"];
                                    if (key === "size")
                                      return [formatBytes(value), "Transfer"];
                                    return [value, key];
                                  }}
                                  contentStyle={{
                                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                                    border:
                                      "1px solid rgba(148, 163, 184, 0.3)",
                                    borderRadius: "12px",
                                    color: "white",
                                  }}
                                />
                                <Legend />
                                <Bar
                                  dataKey="duration"
                                  name="Duration"
                                  fill="#38bdf8"
                                />
                                <Bar
                                  dataKey="size"
                                  name="Transfer"
                                  fill="#22c55e"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                      {/* Screenshot Thumbnails */}
                      {results?.screenshots &&
                        (results.screenshots.thumbnails.length > 0 ||
                          results.screenshots.final) && (
                          <div className="bg-slate-800/30 rounded-xl p-6">
                            <h5 className="text-white font-semibold mb-4">
                              Load Progress
                            </h5>
                            <div className="flex items-center gap-3 overflow-x-auto pb-2">
                              {results.screenshots.thumbnails.map(
                                (src, idx) => (
                                  <Image
                                    key={idx}
                                    src={src}
                                    alt={`Load progress thumbnail ${idx + 1}`}
                                    width={160}
                                    height={96}
                                    className="h-24 w-auto rounded-lg border border-slate-700"
                                  />
                                )
                              )}
                              {results.screenshots.final && (
                                <Image
                                  src={results.screenshots.final}
                                  alt="Final screenshot"
                                  width={160}
                                  height={96}
                                  className="h-24 w-auto rounded-lg border border-slate-700"
                                />
                              )}
                            </div>
                          </div>
                        )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/30 rounded-lg p-4">
                          <p className="text-sm text-slate-400 mb-1">
                            Total Size
                          </p>
                          <p className="text-2xl font-bold text-white">
                            {formatBytes(results.resourceSummary.totalSize)}
                          </p>
                        </div>
                        <div className="bg-slate-800/30 rounded-lg p-4">
                          <p className="text-sm text-slate-400 mb-1">
                            Requests
                          </p>
                          <p className="text-2xl font-bold text-white">
                            {results.resourceSummary.resourceCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="vitals" className="p-8">
                  <div className="space-y-8">
                    <h4 className="text-xl font-bold text-white flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-green-400" />
                      <span>Core Web Vitals</span>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        Google Standards
                      </Badge>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        {
                          title: "Largest Contentful Paint",
                          value: formatTime(
                            results.metrics.largestContentfulPaint
                          ),
                          threshold: "Good: < 2.5s",
                          status:
                            results.metrics.largestContentfulPaint <= 2500
                              ? "good"
                              : results.metrics.largestContentfulPaint <= 4000
                              ? "needs-improvement"
                              : "poor",
                          description: "Measures loading performance",
                        },
                        {
                          title: "Interaction to Next Paint",
                          value: formatTime(
                            results.metrics.interactionToNextPaint || 0
                          ),
                          threshold: "Good: < 200ms",
                          status:
                            (results.metrics.interactionToNextPaint || 0) < 200
                              ? "good"
                              : (results.metrics.interactionToNextPaint || 0) <=
                                500
                              ? "needs-improvement"
                              : "poor",
                          description: "Measures interactivity (replaces FID)",
                          note: "FID has been deprecated in favor of INP.",
                        },
                        {
                          title: "Cumulative Layout Shift",
                          value:
                            results.metrics.cumulativeLayoutShift.toFixed(3),
                          threshold: "Good: < 0.1",
                          status:
                            results.metrics.cumulativeLayoutShift <= 0.1
                              ? "good"
                              : results.metrics.cumulativeLayoutShift <= 0.25
                              ? "needs-improvement"
                              : "poor",
                          description: "Measures visual stability",
                        },
                        {
                          title: "First Contentful Paint",
                          value: formatTime(
                            results.metrics.firstContentfulPaint
                          ),
                          threshold: "Good: < 1.8s",
                          status:
                            results.metrics.firstContentfulPaint <= 1800
                              ? "good"
                              : results.metrics.firstContentfulPaint <= 3000
                              ? "needs-improvement"
                              : "poor",
                          description: "Measures perceived loading speed",
                        },
                      ].map((vital, index) => (
                        <Card
                          key={index}
                          className="bg-slate-800/30 border-slate-700/50"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h5 className="font-semibold text-white mb-1">
                                  {vital.title}
                                </h5>
                                <p className="text-sm text-slate-400 mb-2">
                                  {vital.description}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {vital.threshold}
                                </p>
                                {vital.title ===
                                  "Interaction to Next Paint" && (
                                  <p className="text-xs mt-2 text-slate-500">
                                    {
                                      "FID has been deprecated. INP better reflects real-user interactivity latency."
                                    }
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-white mb-1">
                                  {vital.value}
                                </div>
                                <Badge
                                  className={
                                    vital.status === "good"
                                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                      : vital.status === "needs-improvement"
                                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                      : "bg-red-500/20 text-red-300 border-red-500/30"
                                  }
                                >
                                  {vital.status === "good"
                                    ? "Good"
                                    : vital.status === "needs-improvement"
                                    ? "Needs Work"
                                    : "Poor"}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="opportunities" className="p-8">
                  <div className="space-y-8">
                    <h4 className="text-xl font-bold text-white flex items-center space-x-2">
                      <Target className="h-5 w-5 text-amber-400" />
                      <span>Optimization Opportunities</span>
                    </h4>

                    {results.opportunities.length > 0 ? (
                      <div className="space-y-4">
                        {results.opportunities.map((opportunity, index) => (
                          <Card
                            key={index}
                            className="bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50 transition-colors"
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 pr-4">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h5 className="font-semibold text-white">
                                      {opportunity.title}
                                    </h5>
                                    <Badge
                                      className={`${
                                        implementedOpportunities.has(
                                          opportunity.id
                                        )
                                          ? "bg-green-500/20 text-green-300 border-green-500/30"
                                          : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                      }`}
                                    >
                                      {implementedOpportunities.has(
                                        opportunity.id
                                      )
                                        ? "Implemented"
                                        : "Pending"}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-slate-400 leading-relaxed mb-3">
                                    {opportunity.description}
                                  </p>
                                  {opportunity.displayValue && (
                                    <p className="text-xs text-slate-500">
                                      {opportunity.displayValue}
                                    </p>
                                  )}

                                  {/* Fix Guide Accordion */}
                                  <Accordion
                                    type="single"
                                    collapsible
                                    className="mt-4"
                                  >
                                    <AccordionItem
                                      value="fix-guide"
                                      className="border-slate-600/30"
                                    >
                                      <AccordionTrigger className="text-sm text-amber-300 hover:text-amber-200">
                                        <Target className="h-4 w-4 mr-2" />
                                        View Fix Guide
                                      </AccordionTrigger>
                                      <AccordionContent className="text-sm text-slate-300">
                                        <div className="space-y-3 pt-2">
                                          <div className="bg-slate-700/30 rounded-lg p-3">
                                            <h6 className="font-medium text-white mb-2">
                                              Implementation Steps:
                                            </h6>
                                            <ul className="list-disc list-inside space-y-1 text-xs">
                                              <li>
                                                Review the specific audit
                                                details
                                              </li>
                                              <li>
                                                Implement the suggested
                                                optimizations
                                              </li>
                                              <li>
                                                Test changes in development
                                                environment
                                              </li>
                                              <li>Deploy to production</li>
                                              <li>
                                                Re-run analysis to verify
                                                improvements
                                              </li>
                                            </ul>
                                          </div>
                                          <div className="flex items-center space-x-3">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                const newImplemented = new Set(
                                                  implementedOpportunities
                                                );
                                                if (
                                                  newImplemented.has(
                                                    opportunity.id
                                                  )
                                                ) {
                                                  newImplemented.delete(
                                                    opportunity.id
                                                  );
                                                } else {
                                                  newImplemented.add(
                                                    opportunity.id
                                                  );
                                                }
                                                setImplementedOpportunities(
                                                  newImplemented
                                                );
                                              }}
                                              className={`${
                                                implementedOpportunities.has(
                                                  opportunity.id
                                                )
                                                  ? "border-green-500 text-green-300 hover:bg-green-500/20"
                                                  : "border-amber-500 text-amber-300 hover:bg-amber-500/20"
                                              }`}
                                            >
                                              {implementedOpportunities.has(
                                                opportunity.id
                                              ) ? (
                                                <>
                                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                                  Mark as Pending
                                                </>
                                              ) : (
                                                <>
                                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                                  Mark as Implemented
                                                </>
                                              )}
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                window.open(
                                                  `https://perfex.com/report?url=${encodeURIComponent(
                                                    results.url
                                                  )}`,
                                                  "_blank"
                                                )
                                              }
                                              className="border-blue-500 text-blue-300 hover:bg-blue-500/20"
                                            >
                                              <ExternalLink className="h-4 w-4 mr-1" />
                                              View Details
                                            </Button>
                                          </div>
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-lg mb-2">
                                    <span className="text-sm font-medium">
                                      Save {formatTime(opportunity.savings)}
                                    </span>
                                  </div>
                                  <div
                                    className={`px-2 py-1 rounded text-xs ${
                                      opportunity.savings > 1000
                                        ? "bg-red-500/20 text-red-300"
                                        : opportunity.savings > 500
                                        ? "bg-amber-500/20 text-amber-300"
                                        : "bg-blue-500/20 text-blue-300"
                                    }`}
                                  >
                                    {opportunity.savings > 1000
                                      ? "High Impact"
                                      : opportunity.savings > 500
                                      ? "Medium Impact"
                                      : "Low Impact"}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
                        <h5 className="text-xl font-bold text-white mb-2">
                          No Major Opportunities Found
                        </h5>
                        <p className="text-slate-400">
                          Your site is already well optimized!
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="diagnostics" className="p-8">
                  <div className="space-y-8">
                    <h4 className="text-xl font-bold text-white flex items-center space-x-2">
                      <Info className="h-5 w-5 text-blue-400" />
                      <span>Diagnostic Information</span>
                    </h4>

                    {results.diagnostics.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {results.diagnostics.map((diagnostic, index) => (
                          <Card
                            key={index}
                            className="bg-slate-800/30 border-slate-700/50"
                          >
                            <CardContent className="p-6">
                              <h5 className="font-semibold text-white mb-2">
                                {diagnostic.title}
                              </h5>
                              <p className="text-sm text-slate-400 mb-3 leading-relaxed">
                                {diagnostic.description}
                              </p>
                              <div className="bg-slate-700/30 rounded-lg p-3">
                                <p className="text-xs text-slate-300 font-mono">
                                  {diagnostic.displayValue}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Info className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                        <h5 className="text-xl font-bold text-white mb-2">
                          No Diagnostic Data
                        </h5>
                        <p className="text-slate-400">
                          Diagnostic information not available for this
                          analysis.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="history" className="p-8">
                  {history.length > 1 ? (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xl font-bold text-white flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5 text-cyan-400" />
                          <span>Performance History</span>
                        </h4>
                        <Button
                          onClick={exportHistoryCSV}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-purple-500/25"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export CSV
                        </Button>
                      </div>

                      <div className="bg-slate-800/30 rounded-xl p-6">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={history.slice().reverse()}>
                            <XAxis
                              dataKey="timestamp"
                              tickFormatter={(ts) =>
                                new Date(ts).toLocaleDateString()
                              }
                              tick={{ fontSize: 12, fill: "#94a3b8" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 12, fill: "#94a3b8" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              labelFormatter={(ts) =>
                                new Date(ts).toLocaleString()
                              }
                              formatter={(value: any) => [
                                value,
                                "Performance Score",
                              ]}
                              contentStyle={{
                                backgroundColor: "rgba(15, 23, 42, 0.95)",
                                border: "1px solid rgba(148, 163, 184, 0.3)",
                                borderRadius: "12px",
                                color: "white",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="scores.performance"
                              stroke="#22c55e"
                              strokeWidth={3}
                              dot={{ fill: "#22c55e", strokeWidth: 2, r: 5 }}
                              activeDot={{ r: 8, fill: "#16a34a" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Multi-Metric History Chart */}
                      <div className="bg-slate-800/30 rounded-xl p-6">
                        <h5 className="text-white font-semibold mb-4">
                          Core Web Vitals Trends
                        </h5>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={history.slice().reverse()}>
                            <XAxis
                              dataKey="timestamp"
                              tickFormatter={(ts) =>
                                new Date(ts).toLocaleDateString()
                              }
                              tick={{ fontSize: 12, fill: "#94a3b8" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 12, fill: "#94a3b8" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              labelFormatter={(ts) =>
                                new Date(ts).toLocaleString()
                              }
                              formatter={(value: any, name: any) => {
                                if (name === "LCP")
                                  return [formatTime(value), "LCP"];
                                if (name === "INP")
                                  return [formatTime(value), "INP"];
                                if (name === "FCP")
                                  return [formatTime(value), "FCP"];
                                return [value, name];
                              }}
                              contentStyle={{
                                backgroundColor: "rgba(15, 23, 42, 0.95)",
                                border: "1px solid rgba(148, 163, 184, 0.3)",
                                borderRadius: "12px",
                                color: "white",
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="metrics.largestContentfulPaint"
                              name="LCP"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="metrics.interactionToNextPaint"
                              name="INP"
                              stroke="#8b5cf6"
                              strokeWidth={2}
                              dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="metrics.firstContentfulPaint"
                              name="FCP"
                              stroke="#10b981"
                              strokeWidth={2}
                              dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {history.slice(0, 3).map((record, index) => (
                          <Card
                            key={index}
                            className="bg-slate-800/30 border-slate-700/50"
                          >
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <Badge
                                    className={`${
                                      record.device === "mobile"
                                        ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                        : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                    }`}
                                  >
                                    {record.device === "mobile" ? (
                                      <Smartphone className="h-3 w-3 mr-1" />
                                    ) : (
                                      <Monitor className="h-3 w-3 mr-1" />
                                    )}
                                    {record.device}
                                  </Badge>
                                  <span className="text-xs text-slate-400">
                                    {new Date(
                                      record.timestamp
                                    ).toLocaleDateString()}
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-400">
                                      Performance
                                    </span>
                                    <span className="font-semibold text-white">
                                      {record.scores.performance}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-400">
                                      LCP
                                    </span>
                                    <span className="font-semibold text-white">
                                      {formatTime(
                                        record.metrics.largestContentfulPaint
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-400">
                                      INP
                                    </span>
                                    <span className="font-semibold text-white">
                                      {formatTime(
                                        record.metrics.interactionToNextPaint ||
                                          0
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-400">
                                      CLS
                                    </span>
                                    <span className="font-semibold text-white">
                                      {record.metrics.cumulativeLayoutShift.toFixed(
                                        3
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <TrendingUp className="h-20 w-20 text-slate-600 mx-auto mb-6" />
                      <h4 className="text-2xl font-bold text-white mb-3">
                        No Historical Data
                      </h4>
                      <p className="text-slate-400 mb-8 max-w-md mx-auto">
                        Perform multiple analyses to track performance trends
                        over time.
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Field vs Lab Comparison */}
                <TabsContent value="field-vs-lab" className="p-8">
                  <div className="space-y-8">
                    <h4 className="text-xl font-bold text-white flex items-center space-x-2">
                      <Gauge className="h-5 w-5 text-cyan-400" />
                      <span>Field (Real Users) vs Lab (Simulated)</span>
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-slate-800/30 rounded-xl p-6">
                        <h5 className="text-white font-semibold mb-4">
                          Comparison (Lab vs Field P75)
                        </h5>
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart
                            data={["FCP", "LCP", "INP", "CLS"].map((k) => {
                              const lab = {
                                FCP: results.metrics.firstContentfulPaint,
                                LCP: results.metrics.largestContentfulPaint,
                                INP:
                                  results.metrics.interactionToNextPaint || 0,
                                CLS:
                                  (results.metrics.cumulativeLayoutShift || 0) *
                                  1000, // scale for chart
                              }[k as "FCP"];
                              const fieldMetrics =
                                results.loadingExperience?.metrics ||
                                ({} as any);
                              const field = {
                                FCP:
                                  fieldMetrics.FIRST_CONTENTFUL_PAINT_MS
                                    ?.percentile || 0,
                                LCP:
                                  fieldMetrics.LARGEST_CONTENTFUL_PAINT_MS
                                    ?.percentile || 0,
                                INP:
                                  fieldMetrics.INTERACTION_TO_NEXT_PAINT_MS
                                    ?.percentile || 0,
                                CLS:
                                  (fieldMetrics.CUMULATIVE_LAYOUT_SHIFT_SCORE
                                    ?.percentile || 0) * 10, // visual scale
                              }[k as "FCP"];
                              return { name: k, Lab: lab, Field: field };
                            })}
                          >
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 12, fill: "#94a3b8" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 12, fill: "#94a3b8" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(15,23,42,0.95)",
                                border: "1px solid rgba(148,163,184,0.3)",
                                borderRadius: 12,
                                color: "#fff",
                              }}
                            />
                            <Legend />
                            <Bar dataKey="Lab" fill="#60a5fa" />
                            <Bar dataKey="Field" fill="#34d399" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="bg-slate-800/30 rounded-xl p-6">
                        <h5 className="text-white font-semibold mb-4">
                          Vitals Radar
                        </h5>
                        <ResponsiveContainer width="100%" height={320}>
                          <RadarChart
                            data={["FCP", "LCP", "INP", "CLS", "TBT"].map(
                              (k) => ({
                                metric: k,
                                value: {
                                  FCP: Math.min(
                                    1,
                                    1800 /
                                      Math.max(
                                        1,
                                        results.metrics.firstContentfulPaint
                                      )
                                  ),
                                  LCP: Math.min(
                                    1,
                                    2500 /
                                      Math.max(
                                        1,
                                        results.metrics.largestContentfulPaint
                                      )
                                  ),
                                  INP: Math.min(
                                    1,
                                    200 /
                                      Math.max(
                                        1,
                                        results.metrics
                                          .interactionToNextPaint || 1
                                      )
                                  ),
                                  CLS: Math.min(
                                    1,
                                    0.1 /
                                      Math.max(
                                        0.001,
                                        results.metrics.cumulativeLayoutShift
                                      )
                                  ),
                                  TBT: Math.min(
                                    1,
                                    200 /
                                      Math.max(
                                        1,
                                        results.metrics.totalBlockingTime
                                      )
                                  ),
                                }[k as "FCP"],
                              })
                            )}
                            outerRadius={120}
                          >
                            <PolarGrid />
                            <PolarAngleAxis
                              dataKey="metric"
                              tick={{ fill: "#94a3b8", fontSize: 12 }}
                            />
                            <PolarRadiusAxis
                              angle={30}
                              domain={[0, 1]}
                              tick={false}
                            />
                            <Radar
                              name="Score"
                              dataKey="value"
                              stroke="#22c55e"
                              fill="#22c55e"
                              fillOpacity={0.5}
                            />
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    {!results.loadingExperience && (
                      <p className="text-sm text-slate-400">
                        Field data not available for this URL.
                      </p>
                    )}
                  </div>
                </TabsContent>

                {/* Competitor Benchmarking */}
                <TabsContent value="benchmark" className="p-8">
                  <div className="space-y-8">
                    <h4 className="text-xl font-bold text-white flex items-center space-x-2">
                      <Target className="h-5 w-5 text-amber-400" />
                      <span>Competitor Benchmarking</span>
                    </h4>

                    <div className="bg-slate-800/30 rounded-xl p-6">
                      <h5 className="text-white font-semibold mb-4">
                        Compare Multiple URLs
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {benchmarkUrls.map((url, index) => (
                          <div key={index} className="space-y-2">
                            <label className="text-sm text-slate-300">
                              URL {index + 1}
                            </label>
                            <Input
                              type="url"
                              placeholder={`https://example${index + 1}.com`}
                              value={url}
                              onChange={(e) => {
                                const newUrls = [...benchmarkUrls];
                                newUrls[index] = e.target.value;
                                setBenchmarkUrls(newUrls);
                              }}
                              className="bg-slate-700/50 border-slate-600/50 focus:border-amber-500 text-white placeholder-slate-400"
                            />
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={async () => {
                          const validUrls = benchmarkUrls.filter((url) =>
                            url.trim()
                          );
                          if (validUrls.length === 0) return;

                          setBenchmarkResults([]);
                          for (const url of validUrls) {
                            try {
                              const result = await runSingleAnalysis(
                                url,
                                "mobile"
                              );
                              setBenchmarkResults((prev) => [...prev, result]);
                            } catch (error) {
                              console.error(`Failed to analyze ${url}:`, error);
                            }
                          }
                        }}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0 shadow-lg shadow-amber-500/25"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Run Benchmark
                      </Button>
                    </div>

                    {/* Benchmark Results */}
                    {benchmarkResults.length > 0 && (
                      <div className="space-y-6">
                        <h5 className="text-white font-semibold">
                          Benchmark Results
                        </h5>

                        {/* Performance Scores Comparison */}
                        <div className="bg-slate-800/30 rounded-xl p-6">
                          <h6 className="text-white font-medium mb-4">
                            Performance Scores
                          </h6>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                              data={benchmarkResults.map((result) => ({
                                name: new URL(result.url).hostname.replace(
                                  /^www\./,
                                  ""
                                ),
                                Performance: result.scores.performance,
                                Accessibility: result.scores.accessibility,
                                "Best Practices": result.scores.bestPractices,
                                SEO: result.scores.seo,
                              }))}
                            >
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12, fill: "#94a3b8" }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                domain={[0, 100]}
                                tick={{ fontSize: 12, fill: "#94a3b8" }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "rgba(15,23,42,0.95)",
                                  border: "1px solid rgba(148,163,184,0.3)",
                                  borderRadius: 12,
                                  color: "#fff",
                                }}
                              />
                              <Legend />
                              <Bar dataKey="Performance" fill="#22c55e" />
                              <Bar dataKey="Accessibility" fill="#3b82f6" />
                              <Bar dataKey="Best Practices" fill="#8b5cf6" />
                              <Bar dataKey="SEO" fill="#f59e0b" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Core Web Vitals Comparison */}
                        <div className="bg-slate-800/30 rounded-xl p-6">
                          <h6 className="text-white font-medium mb-4">
                            Core Web Vitals
                          </h6>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                              data={benchmarkResults.map((result) => ({
                                name: new URL(result.url).hostname.replace(
                                  /^www\./,
                                  ""
                                ),
                                LCP: result.metrics.largestContentfulPaint,
                                INP: result.metrics.interactionToNextPaint || 0,
                                CLS:
                                  result.metrics.cumulativeLayoutShift * 1000, // scale for visibility
                              }))}
                            >
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12, fill: "#94a3b8" }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 12, fill: "#94a3b8" }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip
                                formatter={(value: any, name: any) => {
                                  if (name === "LCP" || name === "INP")
                                    return [formatTime(value), name];
                                  if (name === "CLS")
                                    return [(value / 1000).toFixed(3), "CLS"];
                                  return [value, name];
                                }}
                                contentStyle={{
                                  backgroundColor: "rgba(15,23,42,0.95)",
                                  border: "1px solid rgba(148,163,184,0.3)",
                                  borderRadius: 12,
                                  color: "#fff",
                                }}
                              />
                              <Legend />
                              <Bar dataKey="LCP" fill="#3b82f6" />
                              <Bar dataKey="INP" fill="#8b5cf6" />
                              <Bar dataKey="CLS" fill="#f59e0b" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Accessibility Deep Dive */}
                <TabsContent value="accessibility" className="p-8">
                  <div className="space-y-8">
                    <h4 className="text-xl font-bold text-white flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-green-400" />
                      <span>Accessibility Analysis</span>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        {results.scores.accessibility}/100
                      </Badge>
                    </h4>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Accessibility Score Breakdown */}
                      <div className="bg-slate-800/30 rounded-xl p-6">
                        <h5 className="text-white font-semibold mb-4">
                          Accessibility Score
                        </h5>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300">
                              Overall Score
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-white">
                                {results.scores.accessibility}
                              </span>
                              <Badge
                                className={`${
                                  results.scores.accessibility >= 90
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                    : results.scores.accessibility >= 50
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                    : "bg-red-500/20 text-red-300 border-red-500/30"
                                }`}
                              >
                                {results.scores.accessibility >= 90
                                  ? "Excellent"
                                  : results.scores.accessibility >= 50
                                  ? "Good"
                                  : "Needs Work"}
                              </Badge>
                            </div>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-3">
                            <div
                              className="h-3 rounded-full transition-all duration-1000"
                              style={{
                                width: `${results.scores.accessibility}%`,
                                backgroundColor: getScoreColor(
                                  results.scores.accessibility
                                ),
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Key Accessibility Areas */}
                      <div className="bg-slate-800/30 rounded-xl p-6">
                        <h5 className="text-white font-semibold mb-4">
                          Key Areas
                        </h5>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Palette className="h-4 w-4 text-blue-400" />
                              <span className="text-sm text-slate-300">
                                Color Contrast
                              </span>
                            </div>
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                              Critical
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Code className="h-4 w-4 text-purple-400" />
                              <span className="text-sm text-slate-300">
                                Semantic HTML
                              </span>
                            </div>
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                              Important
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Eye className="h-4 w-4 text-green-400" />
                              <span className="text-sm text-slate-300">
                                Screen Reader
                              </span>
                            </div>
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                              Good
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Accessibility Recommendations */}
                    <div className="bg-slate-800/30 rounded-xl p-6">
                      <h5 className="text-white font-semibold mb-4">
                        Recommendations
                      </h5>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-green-400 mt-1" />
                          <div>
                            <p className="text-sm text-white font-medium">
                              Ensure sufficient color contrast
                            </p>
                            <p className="text-xs text-slate-400">
                              Text should have a contrast ratio of at least
                              4.5:1 for normal text
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-green-400 mt-1" />
                          <div>
                            <p className="text-sm text-white font-medium">
                              Use semantic HTML elements
                            </p>
                            <p className="text-xs text-slate-400">
                              Replace divs with appropriate elements like nav,
                              main, article, section
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-green-400 mt-1" />
                          <div>
                            <p className="text-sm text-white font-medium">
                              Add alt text to images
                            </p>
                            <p className="text-xs text-slate-400">
                              All images should have descriptive alt attributes
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* SEO Deep Dive */}
                <TabsContent value="seo" className="p-8">
                  <div className="space-y-8">
                    <h4 className="text-xl font-bold text-white flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-400" />
                      <span>SEO Analysis</span>
                      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                        {results.scores.seo}/100
                      </Badge>
                    </h4>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* SEO Score Breakdown */}
                      <div className="bg-slate-800/30 rounded-xl p-6">
                        <h5 className="text-white font-semibold mb-4">
                          SEO Score
                        </h5>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300">
                              Overall Score
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-white">
                                {results.scores.seo}
                              </span>
                              <Badge
                                className={`${
                                  results.scores.seo >= 90
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                    : results.scores.seo >= 50
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                    : "bg-red-500/20 text-red-300 border-red-500/30"
                                }`}
                              >
                                {results.scores.seo >= 90
                                  ? "Excellent"
                                  : results.scores.seo >= 50
                                  ? "Good"
                                  : "Needs Work"}
                              </Badge>
                            </div>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-3">
                            <div
                              className="h-3 rounded-full transition-all duration-1000"
                              style={{
                                width: `${results.scores.seo}%`,
                                backgroundColor: getScoreColor(
                                  results.scores.seo
                                ),
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Key SEO Areas */}
                      <div className="bg-slate-800/30 rounded-xl p-6">
                        <h5 className="text-white font-semibold mb-4">
                          Key Areas
                        </h5>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FileImage className="h-4 w-4 text-blue-400" />
                              <span className="text-sm text-slate-300">
                                Image Optimization
                              </span>
                            </div>
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                              Critical
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Code className="h-4 w-4 text-purple-400" />
                              <span className="text-sm text-slate-300">
                                Meta Tags
                              </span>
                            </div>
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                              Important
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Globe className="h-4 w-4 text-green-400" />
                              <span className="text-sm text-slate-300">
                                Mobile Friendly
                              </span>
                            </div>
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                              Good
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SEO Recommendations */}
                    <div className="bg-slate-800/30 rounded-xl p-6">
                      <h5 className="text-white font-semibold mb-4">
                        Recommendations
                      </h5>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-green-400 mt-1" />
                          <div>
                            <p className="text-sm text-white font-medium">
                              Optimize images with proper formats
                            </p>
                            <p className="text-xs text-slate-400">
                              Use WebP, AVIF formats and implement lazy loading
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-green-400 mt-1" />
                          <div>
                            <p className="text-sm text-white font-medium">
                              Add comprehensive meta tags
                            </p>
                            <p className="text-xs text-slate-400">
                              Include title, description, and Open Graph tags
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-green-400 mt-1" />
                          <div>
                            <p className="text-sm text-white font-medium">
                              Implement structured data
                            </p>
                            <p className="text-xs text-slate-400">
                              Add JSON-LD schema markup for better search
                              visibility
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Export & Actions */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/50">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Download className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">
                        Export Report
                      </h4>
                      <p className="text-slate-400">
                        Download Perfex performance data
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={exportResults}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-green-500/25"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                    <Button
                      onClick={exportHistoryCSV}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-purple-500/25"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      onClick={exportPDF}
                      className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-red-500/25"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile vs Desktop Comparison */}
            {compareMode && desktopResults && mobileResults && (
              <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/50">
                <CardContent className="p-8">
                  <div className="space-y-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">
                          Mobile vs Desktop Comparison
                        </h3>
                        <p className="text-slate-400">
                          Side-by-side performance analysis
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Desktop Results */}
                      <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                          <Monitor className="h-6 w-6 text-blue-400" />
                          <h4 className="text-xl font-bold text-white">
                            Desktop
                          </h4>
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {desktopResults.scores.performance}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-800/30 rounded-lg p-4">
                            <p className="text-sm text-slate-400 mb-1">
                              Performance
                            </p>
                            <p className="text-2xl font-bold text-white">
                              {desktopResults.scores.performance}
                            </p>
                          </div>
                          <div className="bg-slate-800/30 rounded-lg p-4">
                            <p className="text-sm text-slate-400 mb-1">LCP</p>
                            <p className="text-lg font-semibold text-white">
                              {formatTime(
                                desktopResults.metrics.largestContentfulPaint
                              )}
                            </p>
                          </div>
                          <div className="bg-slate-800/30 rounded-lg p-4">
                            <p className="text-sm text-slate-400 mb-1">INP</p>
                            <p className="text-lg font-semibold text-white">
                              {formatTime(
                                desktopResults.metrics.interactionToNextPaint ||
                                  0
                              )}
                            </p>
                          </div>
                          <div className="bg-slate-800/30 rounded-lg p-4">
                            <p className="text-sm text-slate-400 mb-1">CLS</p>
                            <p className="text-lg font-semibold text-white">
                              {desktopResults.metrics.cumulativeLayoutShift.toFixed(
                                3
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Results */}
                      <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="h-6 w-6 text-purple-400" />
                          <h4 className="text-xl font-bold text-white">
                            Mobile
                          </h4>
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                            {mobileResults.scores.performance}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-800/30 rounded-lg p-4">
                            <p className="text-sm text-slate-400 mb-1">
                              Performance
                            </p>
                            <p className="text-2xl font-bold text-white">
                              {mobileResults.scores.performance}
                            </p>
                          </div>
                          <div className="bg-slate-800/30 rounded-lg p-4">
                            <p className="text-sm text-slate-400 mb-1">LCP</p>
                            <p className="text-lg font-semibold text-white">
                              {formatTime(
                                mobileResults.metrics.largestContentfulPaint
                              )}
                            </p>
                          </div>
                          <div className="bg-slate-800/30 rounded-lg p-4">
                            <p className="text-sm text-slate-400 mb-1">INP</p>
                            <p className="text-lg font-semibold text-white">
                              {formatTime(
                                mobileResults.metrics.interactionToNextPaint ||
                                  0
                              )}
                            </p>
                          </div>
                          <div className="bg-slate-800/30 rounded-lg p-4">
                            <p className="text-sm text-slate-400 mb-1">CLS</p>
                            <p className="text-lg font-semibold text-white">
                              {mobileResults.metrics.cumulativeLayoutShift.toFixed(
                                3
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comparison Chart */}
                    <div className="bg-slate-800/30 rounded-xl p-6">
                      <h5 className="text-white font-semibold mb-4">
                        Performance Comparison
                      </h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={[
                            {
                              metric: "Performance",
                              Desktop: desktopResults.scores.performance,
                              Mobile: mobileResults.scores.performance,
                            },
                            {
                              metric: "Accessibility",
                              Desktop: desktopResults.scores.accessibility,
                              Mobile: mobileResults.scores.accessibility,
                            },
                            {
                              metric: "Best Practices",
                              Desktop: desktopResults.scores.bestPractices,
                              Mobile: mobileResults.scores.bestPractices,
                            },
                            {
                              metric: "SEO",
                              Desktop: desktopResults.scores.seo,
                              Mobile: mobileResults.scores.seo,
                            },
                          ]}
                        >
                          <XAxis
                            dataKey="metric"
                            tick={{ fontSize: 12, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 12, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(15,23,42,0.95)",
                              border: "1px solid rgba(148,163,184,0.3)",
                              borderRadius: 12,
                              color: "#fff",
                            }}
                          />
                          <Legend />
                          <Bar dataKey="Desktop" fill="#3b82f6" />
                          <Bar dataKey="Mobile" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-2 text-slate-500 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Project #3 By <strong> Akash More</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}