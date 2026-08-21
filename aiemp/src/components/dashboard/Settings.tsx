'use client';

import { useEffect, useRef, useState } from 'react';
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

const GALLERY_LIMIT = 12;

export function Settings({
  business,
  businessPhone,
  toggles,
  toggle,
}: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

  // Resolve the business id the same way the rest of the dashboard does —
  // prefer the loaded business record, fall back to what was stashed at
  // login/onboarding time.
  const businessId =
    (business as any)?._id ||
    (typeof window !== 'undefined' ? localStorage.getItem('aria_business_id') : null);

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  // Business gallery — the photos that power the sliding image on the
  // public/customer-facing business card & profile page.
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Services / offerings — editable tag list, seeded from whatever the
  // business registered with (services / servicesProvided depending on
  // your Business type naming).
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');

  // Telegram bot LINK — the public t.me/... link customers tap on the
  // business profile page's "Book via Telegram" button. This is separate
  // from the telegramBotToken (which is the private API token used by
  // the backend to run the bot).
  const [telegramLink, setTelegramLink] = useState('');
  const [editingTelegramLink, setEditingTelegramLink] = useState(false);
  const [savingTelegramLink, setSavingTelegramLink] = useState(false);
  const [telegramLinkError, setTelegramLinkError] = useState('');

  // `business` loads asynchronously (useDashboard fetches it after mount),
  // so seed local state once it actually arrives rather than only at the
  // first render when it's still null.
  useEffect(() => {
    if (!business) return;
    setProfileImage((business as any).image || (business as any).logo || null);
    setGalleryImages((business as any).galleryImages || []);
    setServices(
      (business as any).servicesProvided ?? (business as any).services ?? []
    );
    setTelegramLink((business as any).telegramBotLink || '');
  }, [business]);

  // ------------------------------------------------------------------
  // Profile photo — uploads to Cloudinary via the backend, REPLACES
  // whatever was there before (both on the server and locally), so
  // repeated uploads never pile up.
  // ------------------------------------------------------------------
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!businessId) {
      alert('No business found for this account — try logging in again.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploadingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/business/${businessId}/upload-image`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to upload photo.');
      }

      setProfileImage(data.data.image);
    } catch (err: any) {
      alert(err.message || 'Failed to upload photo.');
    } finally {
      setUploadingProfile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeProfileImage = async () => {
    if (!businessId) {
      setProfileImage(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/business/${businessId}/profile-image`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to remove photo.');
      }

      setProfileImage(null);
    } catch (err: any) {
      alert(err.message || 'Failed to remove photo.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ------------------------------------------------------------------
  // Business gallery — uploads to Cloudinary via the backend. State is
  // always replaced with what the SERVER returns (the full, deduped,
  // capped array) instead of appended to locally, so this can never
  // drift out of sync or duplicate on repeated uploads.
  // ------------------------------------------------------------------
  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    if (validFiles.length === 0) {
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      return;
    }

    if (!businessId) {
      alert('No business found for this account — try logging in again.');
      return;
    }

    const room = GALLERY_LIMIT - galleryImages.length;
    if (room <= 0) {
      alert(`Gallery limit of ${GALLERY_LIMIT} photos reached. Remove some photos first.`);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      return;
    }

    const filesToSend = validFiles.slice(0, room);
    if (validFiles.length > room) {
      alert(`Only ${room} more photo(s) fit under the ${GALLERY_LIMIT}-photo limit — uploading the first ${room}.`);
    }

    const formData = new FormData();
    filesToSend.forEach((file) => formData.append('images', file));

    setUploadingGallery(true);
    try {
      const res = await fetch(`${API_BASE}/business/${businessId}/upload-gallery`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to upload photos.');
      }

      setGalleryImages(data.data.galleryImages);
    } catch (err: any) {
      alert(err.message || 'Failed to upload photos.');
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const removeGalleryImage = async (url: string) => {
    if (!businessId) {
      setGalleryImages((prev) => prev.filter((img) => img !== url));
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/business/${businessId}/gallery-image`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to remove photo.');
      }

      setGalleryImages(data.data.galleryImages);
    } catch (err: any) {
      alert(err.message || 'Failed to remove photo.');
    }
  };

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

  // ------------------------------------------------------------------
  // Telegram bot LINK — the public link customers tap on the business
  // profile page to open a chat with the business's bot.
  // ------------------------------------------------------------------
  const isValidTelegramLink = (value: string) => {
    if (!value) return true; // empty is allowed (clears the link)
    try {
      const url = new URL(value);
      return (
        (url.protocol === 'https:' || url.protocol === 'http:') &&
        (url.hostname === 't.me' || url.hostname === 'telegram.me')
      );
    } catch {
      return false;
    }
  };

  const saveTelegramLink = async () => {
    const trimmed = telegramLink.trim();

    if (!isValidTelegramLink(trimmed)) {
      setTelegramLinkError('Enter a valid Telegram link, e.g. https://t.me/your_bot');
      return;
    }

    if (!businessId) {
      alert('No business found for this account — try logging in again.');
      return;
    }

    setTelegramLinkError('');
    setSavingTelegramLink(true);
    try {
      const res = await fetch(`${API_BASE}/business/${businessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramBotLink: trimmed }),
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to save Telegram link.');
      }

      setTelegramLink(data.data.telegramBotLink || '');
      setEditingTelegramLink(false);
    } catch (err: any) {
      setTelegramLinkError(err.message || 'Failed to save Telegram link.');
    } finally {
      setSavingTelegramLink(false);
    }
  };

  const cancelEditTelegramLink = () => {
    setTelegramLink((business as any)?.telegramBotLink || '');
    setTelegramLinkError('');
    setEditingTelegramLink(false);
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
                    disabled={uploadingProfile}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingProfile
                      ? 'Uploading…'
                      : profileImage
                      ? 'Change photo'
                      : 'Upload photo'}
                  </Button>

                  {profileImage && !uploadingProfile && (
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
              JPG, PNG or WEBP. Max 5MB each, up to {GALLERY_LIMIT} photos.
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
              disabled={uploadingGallery || galleryImages.length >= GALLERY_LIMIT}
            >
              {uploadingGallery
                ? 'Uploading…'
                : galleryImages.length >= GALLERY_LIMIT
                ? `Limit reached (${GALLERY_LIMIT})`
                : 'Add photos'}
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

            {/* Telegram bot LINK — the public link shown on the customer-
                facing profile page's "Book via Telegram" button.
                NOTE: this reads from local `telegramLink` state (kept in
                sync on load + after a successful save), NOT from the
                `business` prop directly — that prop is owned by the
                parent and doesn't get refreshed after this component's
                own PUT request, so reading it here showed stale/blank
                data right after saving. */}
            <div className="py-4 last:pb-0">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="font-medium text-sm">
                    Telegram bot link
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {editingTelegramLink
                      ? 'Paste the public link customers tap to chat with your bot.'
                      : telegramLink
                      ? telegramLink
                      : 'Not set — customers won\u2019t be able to tap through yet.'}
                  </div>
                </div>

                {!editingTelegramLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTelegramLink(true)}
                    className="flex-shrink-0"
                  >
                    {telegramLink ? 'Edit' : 'Add link'}
                  </Button>
                )}
              </div>

              {editingTelegramLink && (
                <div className="mt-3">
                  <div className="flex gap-2">
                    <input
                      value={telegramLink}
                      onChange={(e) => {
                        setTelegramLink(e.target.value);
                        if (telegramLinkError) setTelegramLinkError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveTelegramLink();
                        }
                        if (e.key === 'Escape') {
                          cancelEditTelegramLink();
                        }
                      }}
                      placeholder="https://t.me/your_bot"
                      className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      autoFocus
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={savingTelegramLink}
                      onClick={saveTelegramLink}
                    >
                      {savingTelegramLink ? 'Saving…' : 'Save'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={savingTelegramLink}
                      onClick={cancelEditTelegramLink}
                    >
                      Cancel
                    </Button>
                  </div>
                  {telegramLinkError && (
                    <p className="text-xs text-red-600 mt-1.5">{telegramLinkError}</p>
                  )}
                </div>
              )}
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}