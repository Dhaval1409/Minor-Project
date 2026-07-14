'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Business } from '@/types';

interface SettingsProps {
  business: Business | null;
  businessPhone: string;
  toggles: {
    calls: boolean;
    whatsapp: boolean;
    reminders: boolean;
    followup: boolean;
  };
  toggle: (key: keyof typeof toggles) => void;
}

export function Settings({ business, businessPhone, toggles, toggle }: SettingsProps) {
  const SettingRow = ({ label, sub, control }: { label: string; sub: string; control: React.ReactNode }) => (
    <div className="flex justify-between items-center py-4 border-b last:border-b-0 gap-4">
      <div>
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{sub}</div>
      </div>
      <div className="flex-shrink-0">{control}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b">
        <h1 className="text-2xl font-bold tracking-tight">Aria Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">How Aria represents your business.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business profile</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <SettingRow 
              label="Business name" 
              sub={business?.name || 'Your Business'} 
              control={<Button variant="outline" size="sm">Edit</Button>} 
            />
            <SettingRow 
              label="Business number" 
              sub={businessPhone} 
              control={<Button variant="outline" size="sm">Edit</Button>} 
            />
            <SettingRow 
              label="Business hours" 
              sub="10:00 AM – 8:00 PM, Mon–Sat" 
              control={<Button variant="outline" size="sm">Edit</Button>} 
            />
            <SettingRow 
              label="Connected calendar" 
              sub="Google Calendar — connected" 
              control={<Button variant="outline" size="sm">Change</Button>} 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aria&apos;s behaviour</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <SettingRow 
              label="Answer calls" 
              sub="Pick up automatically 24×7" 
              control={<Switch checked={toggles.calls} onCheckedChange={() => toggle('calls')} />} 
            />
            <SettingRow 
              label="Reply on WhatsApp" 
              sub="Auto-reply to new messages" 
              control={<Switch checked={toggles.whatsapp} onCheckedChange={() => toggle('whatsapp')} />} 
            />
            <SettingRow 
              label="Send appointment reminders" 
              sub="2 hours before each booking" 
              control={<Switch checked={toggles.reminders} onCheckedChange={() => toggle('reminders')} />} 
            />
            <SettingRow 
              label="Auto follow-up on missed leads" 
              sub="After 24 hours of no reply" 
              control={<Switch checked={toggles.followup} onCheckedChange={() => toggle('followup')} />} 
            />
            <div className="py-4 last:pb-0">
              <div className="font-medium text-sm mb-3">Active Languages</div>
              <div className="flex flex-wrap gap-1.5">
                {['English ✓', 'Hindi ✓', 'Marathi ✓'].map((lang) => (
                  <span key={lang} className="px-3 py-1 rounded-lg bg-muted border text-xs font-medium">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}