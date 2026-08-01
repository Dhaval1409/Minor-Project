"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Standard icons included with shadcn/ui
import { Send, AlertCircle, CheckCircle2, Users, Bot, DollarSign, Activity, Search, ShieldAlert } from "lucide-react"; 

// --- TypeScript Interfaces ---
interface Business {
  _id: string;
  name: string;
  businessType: string;
  city: string;
  telegramBotToken?: string;
  createdAt: string;
}

interface Metrics {
  totalBusinesses: number;
  activeBots: number;
  mrr: string;
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics>({ totalBusinesses: 0, activeBots: 0, mrr: "$0" });
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // --- Broadcast State ---
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);

  // --- Data Fetching Logic ---
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setIsLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const headers = { "Content-Type": "application/json" };

        const [metricsRes, businessesRes] = await Promise.all([
          fetch(`${API_URL}/admin/metrics`, { headers }),
          fetch(`${API_URL}/admin/businesses?limit=50`, { headers })
        ]);

        const metricsData = await metricsRes.json();
        const businessesData = await businessesRes.json();

        if (metricsData.success) {
          setMetrics({
            totalBusinesses: metricsData.data.totalBusinesses,
            activeBots: metricsData.data.activeBots,
            mrr: "$4,250", 
          });
        }
        if (businessesData.success) {
          setBusinesses(businessesData.data.businesses);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // --- Broadcast Submit Logic ---
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastMessage) return;

    setIsBroadcasting(true);
    setBroadcastStatus(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/admin/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: broadcastSubject,
          message: broadcastMessage,
          channel: "dashboard"
        })
      });

      const data = await response.json();

      if (data.success) {
        setBroadcastStatus({ type: 'success', msg: data.message });
        setBroadcastSubject("");
        setBroadcastMessage("");
      } else {
        setBroadcastStatus({ type: 'error', msg: data.message || "Failed to send broadcast." });
      }
    } catch (error) {
      setBroadcastStatus({ type: 'error', msg: "Network error occurred while broadcasting." });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const filteredBusinesses = businesses.filter((business) =>
    business.name.toLowerCase().includes(search.toLowerCase()) ||
    business.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    // Adjusted padding for mobile (p-4) vs desktop (md:p-8)
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      
      {/* HEADER: Stack on mobile, side-by-side on desktop */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Super Admin Platform</h2>
          <p className="text-muted-foreground mt-1">Manage tenants, system health, and global announcements.</p>
        </div>
        <Button variant="outline" disabled={isLoading} className="w-full md:w-auto">
          {isLoading ? "Loading..." : "Download Report"}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        {/* TABS: Scrollable on small screens to prevent breaking layout */}
        <div className="w-full overflow-x-auto pb-2">
          <TabsList className="w-full sm:w-auto inline-flex justify-start">
            <TabsTrigger value="overview" className="flex gap-2"><Activity className="w-4 h-4" /> Overview</TabsTrigger>
            <TabsTrigger value="businesses" className="flex gap-2"><Users className="w-4 h-4" /> Businesses</TabsTrigger>
            <TabsTrigger value="broadcast" className="flex gap-2"><Send className="w-4 h-4" /> Broadcast</TabsTrigger>
            <TabsTrigger value="system" className="flex gap-2"><ShieldAlert className="w-4 h-4" /> System Health</TabsTrigger>
          </TabsList>
        </div>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : metrics.totalBusinesses}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Telegram Bots</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : metrics.activeBots}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Est. Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.mrr}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all paid tiers</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* BUSINESSES TAB */}
        <TabsContent value="businesses" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle>Registered Tenants</CardTitle>
              <CardDescription>Manage all businesses currently operating on the platform.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <div className="relative max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search businesses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              {/* TABLE: Wrapped in overflow-x-auto for mobile */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10">
                      <TableHead className="pl-4">Business Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Bot Status</TableHead>
                      <TableHead className="text-right pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading businesses...</TableCell></TableRow>
                    ) : filteredBusinesses.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2"><AlertCircle className="h-6 w-6" /> No businesses found.</TableCell></TableRow>
                    ) : (
                      filteredBusinesses.map((business) => (
                        <TableRow key={business._id}>
                          <TableCell className="font-medium pl-4">{business.name}</TableCell>
                          <TableCell className="capitalize">{business.businessType.replace('_', ' ')}</TableCell>
                          <TableCell>{business.city}</TableCell>
                          <TableCell>
                            {business.telegramBotToken ? (
                              <Badge variant="default" className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200">Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-muted-foreground">Pending Setup</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-4">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm">Manage</Button>
                              <Button variant="outline" size="sm">Impersonate</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BROADCAST TAB */}
        <TabsContent value="broadcast" className="space-y-4">
          <Card className="max-w-3xl shadow-sm border-primary/20">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="flex items-center gap-2">
                Global Announcement
              </CardTitle>
              <CardDescription>
                Send a system-wide alert to all <strong className="text-foreground">{metrics.totalBusinesses || "..."}</strong> registered tenants.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleBroadcast} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold tracking-tight">Announcement Subject</label>
                  <Input 
                    placeholder="e.g., Scheduled Maintenance this Sunday at 2 AM" 
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    className="focus-visible:ring-primary/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold tracking-tight">Message Body</label>
                  <textarea 
                    className="flex min-h-[200px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 leading-relaxed"
                    placeholder="Provide the details of your announcement here..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    required
                  />
                </div>
                
                {broadcastStatus && (
                  <div className={`flex items-center gap-3 p-4 rounded-lg text-sm font-medium border ${broadcastStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20' : 'bg-red-500/10 text-red-800 border-red-500/20'}`}>
                    {broadcastStatus.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
                    {broadcastStatus.msg}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isBroadcasting || !broadcastSubject || !broadcastMessage} className="w-full sm:w-auto gap-2">
                    <Send className="h-4 w-4" />
                    {isBroadcasting ? "Broadcasting..." : "Send Announcement"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SYSTEM HEALTH TAB */}
        <TabsContent value="system" className="space-y-4">
          <Card className="shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/10">
                <div>
                  <p className="font-medium text-sm">Database Connection</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Primary MongoDB cluster</p>
                </div>
                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 border-emerald-200">Stable</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/10">
                <div>
                  <p className="font-medium text-sm">Node Environment</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Current runtime state</p>
                </div>
                <Badge variant="outline" className="capitalize">{process.env.NODE_ENV || 'development'}</Badge>
              </div>

              <div className="pt-6 border-t mt-6">
                <h4 className="text-sm font-medium mb-3">Danger Zone</h4>
                <Button variant="destructive" className="w-full sm:w-auto">Force Sync Bots</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}