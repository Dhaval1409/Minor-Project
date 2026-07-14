// src/components/dashboard/Billing.tsx
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText } from 'lucide-react';

export function Billing() {  // ← Make sure "export" is here
  return (
    <div className="space-y-6">
      <div className="pb-6 border-b">
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">Your plan, usage and invoices.</p>
      </div>

      <Card className="bg-gradient-to-r from-primary/20 to-primary/5 border-primary/20">
        <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-primary">Current plan</div>
            <div className="text-2xl font-bold mt-1">Growth Tier</div>
            <div className="text-xs text-muted-foreground mt-1">
              ₹3,999 / month · Renews on <span className="text-foreground">1 Aug 2026</span>
            </div>
          </div>
          <Button className="bg-primary hover:bg-primary/90">Upgrade to Pro</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage this cycle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-muted-foreground">Conversations</span>
                <span className="font-mono">612 / 1,500</span>
              </div>
              <Progress value={41} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-muted-foreground">Voice minutes</span>
                <span className="font-mono">340 / 800 min</span>
              </div>
              <Progress value={42} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center bg-muted/50 rounded-lg px-5 py-4">
              <div className="flex gap-4 items-center">
                <div className="p-2 rounded-lg bg-background border">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-sm">July 2026 Invoice</div>
                  <div className="text-xs text-muted-foreground mt-0.5">₹3,999 · Settled via Card</div>
                </div>
              </div>
              <Button variant="outline" size="sm">Download PDF</Button>
            </div>
            <div className="flex justify-between items-center bg-muted/50 rounded-lg px-5 py-4">
              <div className="flex gap-4 items-center">
                <div className="p-2 rounded-lg bg-background border">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-sm">June 2026 Invoice</div>
                  <div className="text-xs text-muted-foreground mt-0.5">₹3,999 · Settled via Card</div>
                </div>
              </div>
              <Button variant="outline" size="sm">Download PDF</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}