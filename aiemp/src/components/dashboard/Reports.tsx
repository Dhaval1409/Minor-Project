'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText } from 'lucide-react';

export function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Daily, weekly and monthly summaries of everything Aria did.</p>
        </div>
        <Button>Download all (.csv)</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Conversion trend — last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="pt-4">
              <svg viewBox="0 0 480 150" width="100%" height="150" className="overflow-visible">
                <polyline
                  points="0,110 40,95 80,100 120,80 160,85 200,60 240,68 280,45 320,50 360,30 400,38 440,20 480,25"
                  fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                />
                <polyline
                  points="0,110 40,95 80,100 120,80 160,85 200,60 240,68 280,45 320,50 360,30 400,38 440,20 480,25 480,150 0,150"
                  fill="url(#gradient)" stroke="none"
                />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Where conversations happen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex justify-between text-sm font-medium mb-1.5">
                <span className="text-muted-foreground">Voice calls</span>
                <span className="text-emerald-500 font-mono">62%</span>
              </div>
              <Progress value={62} className="h-2 bg-emerald-500/20" indicatorClassName="bg-emerald-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm font-medium mb-1.5">
                <span className="text-muted-foreground">WhatsApp</span>
                <span className="text-amber-500 font-mono">38%</span>
              </div>
              <Progress value={38} className="h-2 bg-amber-500/20" indicatorClassName="bg-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generated reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { icon: '📄', title: 'Weekly Summary — 23 Jun to 29 Jun', sub: '128 calls · 54 bookings · 31 orders' },
            { icon: '📄', title: 'Weekly Summary — 16 Jun to 22 Jun', sub: '109 calls · 47 bookings · 28 orders' },
            { icon: '📄', title: 'Monthly Summary — May 2026', sub: '462 calls · 201 bookings · 118 orders' },
          ].map((report, i) => (
            <div key={i} className="flex justify-between items-center bg-muted/50 rounded-lg px-5 py-4">
              <div className="flex gap-4 items-center">
                <div className="text-2xl">{report.icon}</div>
                <div>
                  <div className="font-medium text-sm">{report.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{report.sub}</div>
                </div>
              </div>
              <Button variant="outline" size="sm">Download PDF</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}