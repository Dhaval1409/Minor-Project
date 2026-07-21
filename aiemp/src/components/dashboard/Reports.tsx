'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Download } from 'lucide-react';

export function Reports() {
  return (
    <div className="space-y-6">
      {/* ---------- HEADER REGION ---------- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-ink/10">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">Reports</h1>
          <p className="text-[14px] text-text-on-paper-dim mt-1">Daily, weekly and monthly summaries of everything Aria did.</p>
        </div>
        <Button className="bg-ink text-text-on-ink hover:bg-ink/90 font-medium rounded-[10px] gap-2 shadow-sm transition-all">
          <Download className="h-4 w-4" />
          <span>Download all (.csv)</span>
        </Button>
      </div>

      {/* ---------- METRICS OVERVIEW GRID ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <Card className="lg:col-span-2 bg-paper border border-ink/10 rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] overflow-hidden">
          <CardHeader className="border-b border-ink/5 bg-paper-dim/40 py-4 px-6">
            <CardTitle className="font-display text-[15px] font-semibold text-ink">Conversion trend — last 30 days</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="pt-2">
              <svg viewBox="0 0 480 150" width="100%" height="150" className="overflow-visible">
                <polyline
                  points="0,110 40,95 80,100 120,80 160,85 200,60 240,68 280,45 320,50 360,30 400,38 440,20 480,25"
                  fill="none" stroke="var(--amber, #f59e0b)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                />
                <polyline
                  points="0,110 40,95 80,100 120,80 160,85 200,60 240,68 280,45 320,50 360,30 400,38 440,20 480,25 480,150 0,150"
                  fill="url(#gradient)" stroke="none"
                />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--amber, #f59e0b)" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="var(--amber, #f59e0b)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Share Distribution Channel */}
        <Card className="bg-paper border border-ink/10 rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] overflow-hidden">
          <CardHeader className="border-b border-ink/5 bg-paper-dim/40 py-4 px-6">
            <CardTitle className="font-display text-[15px] font-semibold text-ink">Where conversations happen</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div>
              <div className="flex justify-between text-[13px] font-medium mb-2">
                <span className="text-text-on-paper-dim">Voice calls</span>
                <span className="text-emerald font-mono font-semibold">62%</span>
              </div>
              <Progress value={62} className="h-2 bg-emerald/10 rounded-full [&>div]:bg-emerald" />
            </div>
            <div>
              <div className="flex justify-between text-[13px] font-medium mb-2">
                <span className="text-text-on-paper-dim">WhatsApp</span>
                <span className="text-amber font-mono font-semibold">38%</span>
              </div>
              <Progress value={38} className="h-2 bg-amber/10 rounded-full [&>div]:bg-amber" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---------- ARCHIVE DOCUMENTS COLLECTION ---------- */}
      <Card className="bg-paper border border-ink/10 rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] overflow-hidden">
        <CardHeader className="border-b border-ink/5 bg-paper-dim/40 py-4 px-6">
          <CardTitle className="font-display text-[15px] font-semibold text-ink">Generated reports</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {[
            { title: 'Weekly Summary — 23 Jun to 29 Jun', sub: '128 calls · 54 bookings · 31 orders' },
            { title: 'Weekly Summary — 16 Jun to 22 Jun', sub: '109 calls · 47 bookings · 28 orders' },
            { title: 'Monthly Summary — May 2026', sub: '462 calls · 201 bookings · 118 orders' },
          ].map((report, i) => (
            <div 
              key={i} 
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-paper-dim border border-ink/5 rounded-[12px] px-5 py-4 gap-4 transition-all hover:border-ink/10 group"
            >
              <div className="flex gap-4 items-center">
                <div className="h-10 w-10 rounded-[8px] bg-ink/5 text-ink flex items-center justify-center flex-shrink-0 group-hover:bg-ink group-hover:text-text-on-ink transition-colors duration-200">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-[14px] text-ink">{report.title}</div>
                  <div className="text-[12px] font-mono text-text-on-paper-dim mt-0.5">{report.sub}</div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border border-ink/10 bg-transparent text-ink hover:bg-ink/5 font-medium rounded-[8px] text-[13px] w-full sm:w-auto transition-all"
              >
                Download PDF
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}