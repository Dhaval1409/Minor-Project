'use client';

import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Business } from '@/types';

type Toggles = {
  calls: boolean;
  whatsapp: boolean;
  reminders: boolean;
  followup: boolean;
};

type ToggleKey = keyof Toggles;

interface SettingsProps {
  business: Business | null;
  businessPhone: string;
  toggles: Toggles;
  toggle: (key: ToggleKey) => void;
}

export function Settings({
  business,
  businessPhone,
  toggles,
  toggle,
}: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Business gallery — the photos that power the sliding image on the
  // public/customer-facing business card & profile page.
  const initialGallery: string[] = (business as any)?.gallery ?? (business as any)?.images ?? [];
  const [galleryImages, setGalleryImages] = useState<string[]>(initialGallery);

  const handleGalleryUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is larger than 5MB.`);
        return false;
      }
      return true;
    });

    const newUrls = validFiles.map((file) => URL.createObjectURL(file));
    setGalleryImages((prev) => [...prev, ...newUrls].slice(0, 12));

    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  const removeGalleryImage = (url: string) => {
    setGalleryImages((prev) => prev.filter((img) => img !== url));
  };

  // Services / offerings — editable tag list, seeded from whatever the
  // business registered with (services / servicesProvided depending on
  // your Business type naming).
  const initialServices: string[] =
    (business as any)?.servicesProvided ??
    (business as any)?.services ??
    [];
  const [services, setServices] = useState<string[]>(initialServices);
  const [newService, setNewService] = useState('');

  const addService = () => {
    const value = newService.trim();
    if (!value) return;
    if (services.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setNewService('');
      return;
    }
    setServices((prev) => [...prev, value]);
    setNewService('');
  };

  const removeService = (value: string) => {
    setServices((prev) => prev.filter((s) => s !== value));
  };

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // Optional validation
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    // Limit image size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB.');
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setProfileImage(imageUrl);
  };

  const removeProfileImage = () => {
    setProfileImage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const SettingRow = ({
    label,
    sub,
    control,
  }: {
    label: string;
    sub: string;
    control: React.ReactNode;
  }) => (
    <div className="flex justify-between items-center py-4 border-b last:border-b-0 gap-4">
      <div>
        <div className="font-medium text-sm">{label}</div>

        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {sub}
        </div>
      </div>

      <div className="flex-shrink-0">
        {control}
      </div>
    </div>
  );

  // Business hours — pull from the actual business record if present,
  // otherwise fall back to a sane default instead of a hardcoded string.
  const opens = (business as any)?.hours?.opens ?? (business as any)?.openingHours ?? '10:00 AM';
  const closes = (business as any)?.hours?.closes ?? (business as any)?.closingHours ?? '8:00 PM';

  // Telegram bot token — mask everything but the last 4 chars.
  const telegramToken: string = (business as any)?.telegramBotToken ?? '';
  const maskedToken = telegramToken
    ? `${'•'.repeat(Math.max(telegramToken.length - 4, 4))}${telegramToken.slice(-4)}`
    : 'Not connected';

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="pb-6 border-b">
        <h1 className="text-2xl font-bold tracking-tight">
          Aria Settings
        </h1>

        <p className="text-sm text-muted-foreground mt-1">
          How Aria represents your business.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ================= USER PROFILE ================= */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              User profile
            </CardTitle>
          </CardHeader>

          <CardContent>

            {/* Profile Image */}
            <div className="flex items-center gap-5 pb-5 border-b">

              {/* Image */}
              <div className="relative">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted border flex items-center justify-center">
                    <span className="text-2xl font-semibold text-muted-foreground">
                      D
                    </span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div>
                <div className="font-medium text-sm">
                  Profile photo
                </div>

                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  JPG, PNG or WEBP. Maximum 5MB.
                </p>

                <div className="flex gap-2">

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {profileImage ? 'Change photo' : 'Upload photo'}
                  </Button>

                  {profileImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeProfileImage}
                    >
                      Remove
                    </Button>
                  )}

                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="divide-y">

              <SettingRow
                label="Full name"
                sub="Dhaval"
                control={
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                }
              />

              <SettingRow
                label="Email address"
                sub="dhaval@example.com"
                control={
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                }
              />

              <SettingRow
                label="Mobile number"
                sub="+91 XXXXX XXXXX"
                control={
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                }
              />

              <SettingRow
                label="Password"
                sub="••••••••"
                control={
                  <Button variant="outline" size="sm">
                    Change
                  </Button>
                }
              />

            </div>

          </CardContent>
        </Card>


        {/* ================= BUSINESS PROFILE ================= */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Business profile
            </CardTitle>
          </CardHeader>

          <CardContent className="divide-y">

            <SettingRow
              label="Business name"
              sub={business?.name || 'Your Business'}
              control={
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              }
            />

            <SettingRow
              label="Business type"
              sub={(business as any)?.businessType ?? (business as any)?.category ?? 'Not set'}
              control={
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              }
            />

            <SettingRow
              label="City / location"
              sub={(business as any)?.city ?? (business as any)?.location ?? 'Not set'}
              control={
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              }
            />

            <SettingRow
              label="Business number"
              sub={businessPhone}
              control={
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              }
            />

            <SettingRow
              label="Business hours"
              sub={`${opens} – ${closes}`}
              control={
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              }
            />

            <SettingRow
              label="Connected calendar"
              sub="Google Calendar — connected"
              control={
                <Button variant="outline" size="sm">
                  Change
                </Button>
              }
            />

            {/* Services / Products offered */}
            <div className="py-4 last:pb-0">
              <div className="font-medium text-sm mb-1">
                Services offered
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Aria reads this list to confirm what you offer to customers.
              </p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {services.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    No services added yet.
                  </span>
                )}
                {services.map((s) => (
                  <span
                    key={s}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted border text-xs font-medium"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeService(s)}
                      aria-label={`Remove ${s}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addService();
                    }
                  }}
                  placeholder="e.g. Haircut, Hair Spa"
                  className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <Button variant="outline" size="sm" onClick={addService}>
                  Add
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>


        {/* ================= BUSINESS GALLERY ================= */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Business gallery
            </CardTitle>
          </CardHeader>

          <CardContent>

            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              These photos power the sliding image on your public business card
              and profile page. Upload a few shots of your space, work, or products.
              JPG, PNG or WEBP. Max 5MB each, up to 12 photos.
            </p>

            {/* Sliding preview strip */}
            {galleryImages.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 mb-4 -mx-1 px-1 scrollbar-hide">
                {galleryImages.map((url) => (
                  <div
                    key={url}
                    className="relative shrink-0 w-32 h-24 rounded-xl overflow-hidden border group"
                  >
                    <img
                      src={url}
                      alt="Business gallery"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(url)}
                      aria-label="Remove photo"
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 rounded-xl border border-dashed mb-4 text-xs text-muted-foreground">
                No photos yet — add some to show on your profile.
              </div>
            )}

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={handleGalleryUpload}
              className="hidden"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => galleryInputRef.current?.click()}
              disabled={galleryImages.length >= 12}
            >
              {galleryImages.length >= 12 ? 'Limit reached (12)' : 'Add photos'}
            </Button>

          </CardContent>
        </Card>


        {/* ================= ARIA BEHAVIOUR ================= */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Aria&apos;s behaviour
            </CardTitle>
          </CardHeader>

          <CardContent className="divide-y">

            <SettingRow
              label="Answer calls"
              sub="Pick up automatically 24×7"
              control={
                <Switch
                  checked={toggles.calls}
                  onCheckedChange={() => toggle('calls')}
                />
              }
            />

            <SettingRow
              label="Reply on WhatsApp"
              sub="Auto-reply to new messages"
              control={
                <Switch
                  checked={toggles.whatsapp}
                  onCheckedChange={() => toggle('whatsapp')}
                />
              }
            />

            <SettingRow
              label="Send appointment reminders"
              sub="2 hours before each booking"
              control={
                <Switch
                  checked={toggles.reminders}
                  onCheckedChange={() => toggle('reminders')}
                />
              }
            />

            <SettingRow
              label="Auto follow-up on missed leads"
              sub="After 24 hours of no reply"
              control={
                <Switch
                  checked={toggles.followup}
                  onCheckedChange={() => toggle('followup')}
                />
              }
            />

            {/* Languages */}
            <div className="py-4 last:pb-0">

              <div className="font-medium text-sm mb-3">
                Active Languages
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['English ✓', 'Hindi ✓', 'Marathi ✓'].map((lang) => (
                  <span
                    key={lang}
                    className="px-3 py-1 rounded-lg bg-muted border text-xs font-medium"
                  >
                    {lang}
                  </span>
                ))}
              </div>

            </div>

          </CardContent>
        </Card>


        {/* ================= INTEGRATIONS ================= */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Integrations
            </CardTitle>
          </CardHeader>

          <CardContent className="divide-y">

            <SettingRow
              label="Telegram bot token"
              sub={maskedToken}
              control={
                <Button variant="outline" size="sm">
                  {telegramToken ? 'Update' : 'Connect'}
                </Button>
              }
            />

          </CardContent>
        </Card>

      </div>
    </div>
  );
}