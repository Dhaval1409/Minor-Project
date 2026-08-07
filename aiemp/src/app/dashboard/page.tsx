// 'use client';

// import { useState, useEffect } from 'react';
// import { Sidebar } from '@/components/dashboard/Sidebar';
// import { Overview } from '@/components/dashboard/Overview';
// import { Appointments } from '@/components/dashboard/Appointments';
// import { Reports } from '@/components/dashboard/Reports';
// import { Calls } from '@/components/dashboard/Calls';
// import { WhatsApp } from '@/components/dashboard/WhatsApp';
// import { Orders } from '@/components/dashboard/Orders';
// import { Leads } from '@/components/dashboard/Leads';
// import { Settings } from '@/components/dashboard/Settings';
// import { Billing } from '@/components/dashboard/Billing';
// import { useDashboard } from '@/hooks/useDashboard';

// // --- MAIN GATEKEEPER WRAPPER ---
// export default function DashboardPage() {
//   const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
//   const [token, setToken] = useState<string | null>(null);
//   const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
//   const [errorMsg, setErrorMsg] = useState('');
//   const [loading, setLoading] = useState(false);

//   const [loginData, setLoginData] = useState({ email: '', password: '' });

//   // Expanded registration payload — now mirrors the onboarding wizard
//   // (Step 1: identity, Step 2: shop details incl. hours + services, Step 3: inventory/telegram)
//   const [regData, setRegData] = useState({
//     name: '',
//     email: '',
//     password: '',
//     phone: '',
//     businessName: '',
//     businessType: '',
//     city: '',
//     openingHours: '',
//     closingHours: '',
//     services: '',
//     telegramBotToken: '',
//   });

//   // Mobile-only step tracker for the register form (1: identity, 2: shop details, 3: inventory/telegram).
//   // Desktop ignores this and always shows the full scrollable form.
//   const REG_STEPS = 3;
//   const [regStep, setRegStep] = useState(1);

//   const validateRegStep = (step: number) => {
//     if (step === 1) {
//       if (!regData.name || !regData.email || !regData.phone || !regData.password) {
//         setErrorMsg('Please fill in all required fields before continuing.');
//         return false;
//       }
//     }
//     if (step === 2) {
//       if (!regData.businessName || !regData.businessType) {
//         setErrorMsg('Please fill in all required fields before continuing.');
//         return false;
//       }
//     }
//     setErrorMsg('');
//     return true;
//   };

//   const goToRegStep = (step: number) => {
//     if (step > regStep && !validateRegStep(regStep)) return;
//     setErrorMsg('');
//     setRegStep(step);
//   };

//   // Hydrate, bridge onboarding keys, and verify session status safely on mount
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const storedToken = localStorage.getItem('aria_auth_token') || localStorage.getItem('tenantToken');

//       if (storedToken) {
//         // Bridge onboarding credentials to accommodate legacy useDashboard hooks
//         if (!localStorage.getItem('tenantToken')) {
//           localStorage.setItem('tenantToken', storedToken);
//         }

//         // Prevent blank shop profiles if redirected instantly from the onboarding module
//         if (!localStorage.getItem('businessMeta')) {
//           const fallbackName = localStorage.getItem('aria_user_name') || 'My Shop';
//           const fallbackId = localStorage.getItem('aria_business_id') || '';
//           localStorage.setItem('businessMeta', JSON.stringify({
//             id: fallbackId,
//             _id: fallbackId,
//             name: fallbackName
//           }));
//         }

//         setToken(storedToken);
//       }
//     }
//   }, []);

//   const handleLoginSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setErrorMsg('');
//     setLoading(true);

//     try {
//       const res = await fetch(`${API_BASE}/auth/login`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(loginData)
//       });
//       const data = await res.json();

//       if (data.success || res.ok) {
//         localStorage.setItem('aria_auth_token', data.token);
//         localStorage.setItem('tenantToken', data.token);

//         if (data.business) {
//           localStorage.setItem('businessMeta', JSON.stringify(data.business));
//           localStorage.setItem('aria_business_id', data.business.id || data.business._id || '');
//         }
//         if (data.user) {
//           localStorage.setItem('aria_user_id', data.user.id || data.user._id || '');
//           localStorage.setItem('aria_user_email', data.user.email || loginData.email);
//           localStorage.setItem('aria_user_name', data.user.fullName || data.user.name || '');
//         }

//         setToken(data.token);
//         window.location.reload();
//       } else {
//         setErrorMsg(data.message || 'Authentication credentials rejected.');
//       }
//     } catch (err) {
//       setErrorMsg('Network transmission failure. Verify backend server routing status.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRegisterSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setErrorMsg('');

//     // On mobile the form is split into 3 steps. If the browser fires a native
//     // submit early (e.g. hitting Enter mid-flow) while we're not yet on the
//     // final step, treat it as "advance to next step" instead of submitting —
//     // desktop always shows the full form, so this only ever applies there.
//     if (typeof window !== 'undefined' && window.innerWidth < 768 && regStep < REG_STEPS) {
//       goToRegStep(regStep + 1);
//       return;
//     }

//     setLoading(true);

//     try {
//       // Shaped to match businessModel.ts EXACTLY, since a mismatched key here
//       // (e.g. "services" instead of "servicesProvided") silently saves as an
//       // empty array/default and Aria's bot will think the shop has no data.
//       const payload = {
//         name: regData.businessName,       // business/shop name -> schema "name"
//         ownerName: regData.name,          // admin's personal name -> schema "ownerName"
//         email: regData.email,
//         password: regData.password,
//         phone: regData.phone,
//         businessType: regData.businessType,
//         city: regData.city,
//         hours: {
//           opens: regData.openingHours || "10:00 AM",
//           closes: regData.closingHours || "08:00 PM",
//         },
//         servicesProvided: regData.services
//           .split(',')
//           .map((s) => s.trim())
//           .filter(Boolean),
//         telegramBotToken: regData.telegramBotToken,
//       };

//       const res = await fetch(`${API_BASE}/auth/register`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       });
//       const data = await res.json();

//       if (data.success || res.ok) {
//         localStorage.setItem('aria_auth_token', data.token);
//         localStorage.setItem('tenantToken', data.token);

//         if (data.business) {
//           localStorage.setItem('businessMeta', JSON.stringify(data.business));
//           localStorage.setItem('aria_business_id', data.business.id || data.business._id || '');
//         }

//         localStorage.setItem('aria_user_email', regData.email);
//         localStorage.setItem('aria_user_name', regData.name);

//         // Fallback in case the backend response doesn't echo `business` back yet
//         if (!data.business) {
//           localStorage.setItem('businessMeta', JSON.stringify({
//             id: '',
//             _id: '',
//             name: regData.businessName,
//             type: regData.businessType,
//           }));
//         }

//         setToken(data.token);
//         window.location.reload();
//       } else {
//         setErrorMsg(data.message || 'Ecosystem deployment registration rejected.');
//       }
//     } catch (err) {
//       setErrorMsg('Network transmission failure. Verify backend server routing status.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Render Login screen if not authenticated
//   if (!token) {
//     return (
//       <div className="relative min-h-screen bg-ink font-body text-text-on-paper flex items-center justify-center p-6 selection:bg-[#d9a05b]/20 overflow-hidden">
//         {/* Mobile / tablet — static image */}
//         <img
//           src="/aria.png"
//           alt="Aria, your AI employee"
//           className="block md:hidden absolute inset-0 w-full h-full object-cover object-[62%_26%]"
//         />
//         {/* Desktop — looping video */}
//         <video
//           className="hidden md:block absolute inset-0 w-full h-full object-cover object-[100%_20%]"
//           src="/aria2.mp4"
//           poster="/aria-hero-poster.jpg"
//           autoPlay
//           muted
//           loop
//           playsInline
//         />

//         {/* Same scrim treatment as the landing page hero */}
//         <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 md:via-ink/70 to-ink/35 md:to-ink/15" />
//         <div className="absolute inset-0 bg-[radial-gradient(800px_420px_at_85%_-10%,rgba(217,142,43,0.18),transparent_60%)]" />
//         {/* Extra dark wash so the form card stays legible over motion */}
//         <div className="absolute inset-0 bg-ink/45" />

//         {/* --- CARD: solid black box, cream text throughout (was translucent cream card w/ dark text) --- */}
//         <div className="w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-8 relative overflow-hidden z-10">
//           <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#d9a05b]" />

//           <div className="flex items-center justify-center space-x-2 mb-8 mt-2">
//             <span className="h-2.5 w-2.5 rounded-full bg-[#3ab795] animate-pulse" />
//             <span className="font-display font-bold text-[22px] text-[#faf6ec] tracking-tight">Aria Console</span>
//           </div>

//           <div className="flex justify-center space-x-1 mb-6 bg-white/5 p-1 rounded-xl">
//             <button
//               type="button"
//               className={`flex-1 text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg transition-all duration-200 ${authTab === 'login' ? 'bg-[#d9a05b] text-ink shadow-sm' : 'text-[#faf6ec]/80 hover:text-[#faf6ec]'}`}
//               onClick={() => { setAuthTab('login'); setErrorMsg(''); setRegStep(1); }}
//               disabled={loading}
//             >
//               Sign In
//             </button>
//             <button
//               type="button"
//               className={`flex-1 text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg transition-all duration-200 ${authTab === 'register' ? 'bg-[#d9a05b] text-ink shadow-sm' : 'text-[#faf6ec]/80 hover:text-[#faf6ec]'}`}
//               onClick={() => { setAuthTab('register'); setErrorMsg(''); setRegStep(1); }}
//               disabled={loading}
//             >
//               Register Shop
//             </button>
//           </div>

//           {errorMsg && (
//             <div className="mb-4 p-3 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-mono animate-in fade-in duration-200">
//               ⚠️ {errorMsg}
//             </div>
//           )}

//           {authTab === 'login' ? (
//             <form onSubmit={handleLoginSubmit} className="space-y-4">
//               <div>
//                 <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-1">Business Email</label>
//                 <input
//                   type="email" required
//                   className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
//                   value={loginData.email}
//                   onChange={e => setLoginData({...loginData, email: e.target.value})}
//                   disabled={loading}
//                 />
//               </div>
//               <div>
//                 <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-1">Password</label>
//                 <input
//                   type="password" required
//                   className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
//                   value={loginData.password}
//                   onChange={e => setLoginData({...loginData, password: e.target.value})}
//                   disabled={loading}
//                 />
//               </div>
//               <button
//                 type="submit"
//                 className="w-full bg-[#d9a05b] hover:bg-[#d9a05b]/90 text-ink font-semibold p-3.5 rounded-xl transition mt-4 shadow-sm text-sm tracking-tight disabled:opacity-50 transform active:scale-[0.98]"
//                 disabled={loading}
//               >
//                 {loading ? 'Verifying Workspace Session...' : 'Access Workspace →'}
//               </button>
//             </form>
//           ) : (
//             <form onSubmit={handleRegisterSubmit} className="space-y-3.5">

//               {/* Mobile-only step indicator — desktop shows the full form, so this stays hidden there */}
//               <div className="md:hidden mb-1">
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-[10px] font-bold text-[#faf6ec]/60 uppercase tracking-widest">
//                     Step {regStep} of {REG_STEPS}
//                   </span>
//                   <span className="text-[10px] font-bold text-[#d9a05b] uppercase tracking-widest">
//                     {regStep === 1 ? 'Your Details' : regStep === 2 ? 'Shop Details' : 'Inventory'}
//                   </span>
//                 </div>
//                 <div className="flex gap-1.5">
//                   {Array.from({ length: REG_STEPS }).map((_, i) => (
//                     <div
//                       key={i}
//                       className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
//                         i + 1 <= regStep ? 'bg-[#d9a05b]' : 'bg-white/10'
//                       }`}
//                     />
//                   ))}
//                 </div>
//               </div>

//               {/* Fields wrapper — scrolls on desktop only; mobile shows one short step at a time */}
//               <div className="space-y-3.5 md:max-h-[58vh] md:overflow-y-auto md:pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

//                 {/* --- STEP 1: Identity --- */}
//                 <div className={`space-y-3.5 ${regStep === 1 ? 'block' : 'hidden'} md:block`}>
//                   <div>
//                     <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Full Name *</label>
//                     <input
//                       type="text" required placeholder="Rina Deshmukh"
//                       className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
//                       value={regData.name}
//                       onChange={e => setRegData({...regData, name: e.target.value})}
//                       disabled={loading}
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Email Address *</label>
//                     <input
//                       type="email" required
//                       className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
//                       value={regData.email}
//                       onChange={e => setRegData({...regData, email: e.target.value})}
//                       disabled={loading}
//                     />
//                   </div>
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Mobile Number *</label>
//                       <input
//                         type="text" required placeholder="+91 98xxx xxxxx"
//                         className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
//                         value={regData.phone}
//                         onChange={e => setRegData({...regData, phone: e.target.value})}
//                         disabled={loading}
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Password *</label>
//                       <input
//                         type="password" required minLength={6}
//                         className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
//                         value={regData.password}
//                         onChange={e => setRegData({...regData, password: e.target.value})}
//                         disabled={loading}
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 {/* --- STEP 2: Shop Details --- */}
//                 <div className={`space-y-3.5 ${regStep === 2 ? 'block' : 'hidden'} md:block`}>
//                   <div className="border-t border-white/10 pt-3 mt-1 md:block hidden">
//                     <p className="text-[10px] font-bold text-[#d9a05b] uppercase tracking-widest mb-2">Shop Details</p>
//                   </div>

//                   <div>
//                     <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Business Name *</label>
//                     <input
//                       type="text" required placeholder="Rina Salon"
//                       className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
//                       value={regData.businessName}
//                       onChange={e => setRegData({...regData, businessName: e.target.value})}
//                       disabled={loading}
//                     />
//                   </div>

//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Business Type *</label>
//                       <input
//                         type="text" required placeholder="e.g., Salon / Spa"
//                         className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
//                         value={regData.businessType}
//                         onChange={e => setRegData({...regData, businessType: e.target.value})}
//                         disabled={loading}
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">City Location</label>
//                       <input
//                         type="text" placeholder="Pune"
//                         className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
//                         value={regData.city}
//                         onChange={e => setRegData({...regData, city: e.target.value})}
//                         disabled={loading}
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Operating Hours</label>
//                     <div className="grid grid-cols-2 gap-2">
//                       <input
//                         type="text" placeholder="Opens — 10:00 AM"
//                         className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
//                         value={regData.openingHours}
//                         onChange={e => setRegData({...regData, openingHours: e.target.value})}
//                         disabled={loading}
//                       />
//                       <input
//                         type="text" placeholder="Closes — 8:00 PM"
//                         className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
//                         value={regData.closingHours}
//                         onChange={e => setRegData({...regData, closingHours: e.target.value})}
//                         disabled={loading}
//                       />
//                     </div>
//                     <p className="text-[10px] text-[#faf6ec]/55 mt-1">
//                       Aria locks scheduling blocks within this timeframe unless overridden later in Settings.
//                     </p>
//                   </div>
//                 </div>

//                 {/* --- STEP 3: Inventory & Integrations --- */}
//                 <div className={`space-y-3.5 ${regStep === 3 ? 'block' : 'hidden'} md:block`}>
//                   <div>
//                     <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Services / Products Inventory</label>
//                     <textarea
//                       placeholder="Haircut, hair spa, facial, bridal package..."
//                       rows={3}
//                       className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50 resize-none"
//                       value={regData.services}
//                       onChange={e => setRegData({...regData, services: e.target.value})}
//                       disabled={loading}
//                     />
//                     <p className="text-[10px] text-[#faf6ec]/55 mt-1">
//                       Comma-separated. Aria reads this to confirm inventory or menu availability to customers.
//                     </p>
//                   </div>

//                   <div>
//                     <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Telegram Bot Token (Optional)</label>
//                     <input
//                       type="text" placeholder="123456:ABCdef..."
//                       className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
//                       value={regData.telegramBotToken}
//                       onChange={e => setRegData({...regData, telegramBotToken: e.target.value})}
//                       disabled={loading}
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* --- Navigation: mobile gets Back / Continue per step, desktop always gets the single deploy button --- */}
//               <div className="flex items-center gap-2 pt-1">
//                 <button
//                   type="button"
//                   onClick={() => goToRegStep(regStep - 1)}
//                   disabled={loading}
//                   className={`md:hidden ${regStep === 1 ? 'hidden' : 'flex'} items-center justify-center px-4 py-3.5 rounded-xl border border-white/10 text-[#faf6ec]/80 text-sm font-medium hover:bg-white/5 transition disabled:opacity-50`}
//                 >
//                   Back
//                 </button>

//                 <button
//                   type="button"
//                   onClick={() => goToRegStep(regStep + 1)}
//                   disabled={loading}
//                   className={`md:hidden ${regStep < REG_STEPS ? 'flex' : 'hidden'} flex-1 items-center justify-center bg-[#d9a05b] hover:bg-[#d9a05b]/90 text-ink font-semibold p-3.5 rounded-xl transition shadow-sm text-sm tracking-tight disabled:opacity-50 transform active:scale-[0.98]`}
//                 >
//                   Continue →
//                 </button>

//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className={`${regStep === REG_STEPS ? 'flex' : 'hidden'} md:flex flex-1 items-center justify-center bg-[#d9a05b] hover:bg-[#d9a05b]/90 text-ink font-semibold p-3.5 rounded-xl transition shadow-sm text-sm tracking-tight disabled:opacity-50 transform active:scale-[0.98]`}
//                 >
//                   {loading ? 'Provisioning Micro-Services...' : 'Deploy Shop Ecosystem →'}
//                 </button>
//               </div>
//             </form>
//           )}
//         </div>
//       </div>
//     );
//   }

//   // Render dashboard workspace ONLY when token verification and key hydration are absolute
//   return <AuthenticatedDashboard setToken={setToken} />;
// }

// // --- ISOLATED AUTHENTICATED WORKSPACE COMPONENT ---
// function AuthenticatedDashboard({ setToken }: { setToken: (t: string | null) => void }) {
//   const [view, setView] = useState('overview');

//   // Hook safely initializes now because localStorage conditions are verified
//   const {
//     appointments,
//     loadingAppts,
//     apptError,
//     business,
//     businessPhone,
//     greeting,
//     toggles,
//     toggle,
//     loadAppointments,
//     handleAddAppointment,
//     handleCancelAppointment,
//     handleCompleteAppointment, // ◄ FIX: was missing, which is why <Appointments> received undefined for onComplete
//   } = useDashboard();

//   const handleLogout = () => {
//     localStorage.removeItem('aria_auth_token');
//     localStorage.removeItem('aria_business_id');
//     localStorage.removeItem('aria_user_id');
//     localStorage.removeItem('aria_user_email');
//     localStorage.removeItem('aria_user_name');
//     localStorage.removeItem('tenantToken');
//     localStorage.removeItem('businessMeta');

//     setToken(null);
//     window.location.reload();
//   };

//   const renderView = () => {
//     switch (view) {
//       case 'overview':
//         return <Overview appointments={appointments} loadingAppts={loadingAppts} business={business} greeting={greeting} />;
//       case 'appointments':
//         return (
//           <Appointments
//             appointments={appointments}
//             loadingAppts={loadingAppts}
//             apptError={apptError}
//             onAdd={handleAddAppointment}
//             onCancel={handleCancelAppointment}
//             onComplete={handleCompleteAppointment} // ◄ FIX: this was never passed down, so the button fired `undefined(id)`
//             loadAppointments={loadAppointments}
//           />
//         );
//       case 'reports': return <Reports />;
//       case 'calls': return <Calls />;
//       case 'whatsapp': return <WhatsApp />;
//       case 'orders': return <Orders />;
//       case 'leads': return <Leads />;
//       case 'settings':
//         return <Settings business={business} businessPhone={businessPhone} toggles={toggles} toggle={toggle} />;
//       case 'billing': return <Billing />;
//       default:
//         return (
//           <div className="text-center text-text-on-paper-dim font-mono text-[13px] py-12">
//             View workspace segment not found
//           </div>
//         );
//     }
//   };

//   return (
//     <div className="min-h-screen bg-paper font-body text-text-on-paper flex selection:bg-[#d9a05b]/20">
//       <Sidebar view={view} setView={setView} />

//       <main className="flex-1 flex flex-col h-screen overflow-hidden">
//         <header className="flex-shrink-0 h-[72px] bg-paper/85 backdrop-blur-md border-b border-ink/10 flex items-center justify-between px-8 z-40 lg:pl-8 pl-20">
//           <div>
//             <h1 className="font-display font-bold text-[20px] text-ink tracking-tight capitalize inline-block">
//               {view}
//             </h1>
//             {business?.name && (
//               <span className="ml-3 text-xs opacity-60 font-mono hidden sm:inline-block">
//                 ({business.name})
//               </span>
//             )}
//           </div>

//           <button
//             onClick={handleLogout}
//             className="text-xs bg-ink/5 hover:bg-rose-500/10 text-text-on-paper hover:text-rose-600 border border-ink/10 hover:border-rose-500/20 px-3.5 py-2 rounded-lg transition duration-200 font-medium"
//           >
//             Sign Out
//           </button>
//         </header>

//         <div className="flex-1 overflow-y-auto p-8">
//           <div className="max-w-[1180px] mx-auto">
//             {renderView()}
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }

'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Overview } from '@/components/dashboard/Overview';
import { Appointments } from '@/components/dashboard/Appointments';
import { Reports } from '@/components/dashboard/Reports';
import { Calls } from '@/components/dashboard/Calls';
import { WhatsApp } from '@/components/dashboard/WhatsApp';
import { Orders } from '@/components/dashboard/Orders';
import { Leads } from '@/components/dashboard/Leads';
import { Settings } from '@/components/dashboard/Settings';
import { Billing } from '@/components/dashboard/Billing';
import { useDashboard } from '@/hooks/useDashboard';

// --- MAIN GATEKEEPER WRAPPER ---
export default function DashboardPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
  const [token, setToken] = useState<string | null>(null);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Expanded registration payload — now mirrors the onboarding wizard
  // (Step 1: identity, Step 2: shop details incl. hours + services, Step 3: inventory/telegram)
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    businessType: '',
    city: '',
    openingHours: '',
    closingHours: '',
    services: '',
    telegramBotToken: '',
  });

  // Step tracker for the register form (1: identity, 2: shop details, 3: inventory/telegram).
  // Now drives BOTH mobile and desktop — the form always shows one step at a time.
  const REG_STEPS = 3;
  const [regStep, setRegStep] = useState(1);

  const validateRegStep = (step: number) => {
    if (step === 1) {
      if (!regData.name || !regData.email || !regData.phone || !regData.password) {
        setErrorMsg('Please fill in all required fields before continuing.');
        return false;
      }
    }
    if (step === 2) {
      if (!regData.businessName || !regData.businessType) {
        setErrorMsg('Please fill in all required fields before continuing.');
        return false;
      }
    }
    setErrorMsg('');
    return true;
  };

  const goToRegStep = (step: number) => {
    if (step > regStep && !validateRegStep(regStep)) return;
    setErrorMsg('');
    setRegStep(step);
  };

  // Hydrate, bridge onboarding keys, and verify session status safely on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('aria_auth_token') || localStorage.getItem('tenantToken');

      if (storedToken) {
        // Bridge onboarding credentials to accommodate legacy useDashboard hooks
        if (!localStorage.getItem('tenantToken')) {
          localStorage.setItem('tenantToken', storedToken);
        }

        // Prevent blank shop profiles if redirected instantly from the onboarding module
        if (!localStorage.getItem('businessMeta')) {
          const fallbackName = localStorage.getItem('aria_user_name') || 'My Shop';
          const fallbackId = localStorage.getItem('aria_business_id') || '';
          localStorage.setItem('businessMeta', JSON.stringify({
            id: fallbackId,
            _id: fallbackId,
            name: fallbackName
          }));
        }

        setToken(storedToken);
      }
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();

      if (data.success || res.ok) {
        localStorage.setItem('aria_auth_token', data.token);
        localStorage.setItem('tenantToken', data.token);

        if (data.business) {
          localStorage.setItem('businessMeta', JSON.stringify(data.business));
          localStorage.setItem('aria_business_id', data.business.id || data.business._id || '');
        }
        if (data.user) {
          localStorage.setItem('aria_user_id', data.user.id || data.user._id || '');
          localStorage.setItem('aria_user_email', data.user.email || loginData.email);
          localStorage.setItem('aria_user_name', data.user.fullName || data.user.name || '');
        }

        setToken(data.token);
        window.location.reload();
      } else {
        setErrorMsg(data.message || 'Authentication credentials rejected.');
      }
    } catch (err) {
      setErrorMsg('Network transmission failure. Verify backend server routing status.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // The form is split into 3 steps on ALL screen sizes now. If the browser
    // fires a native submit early (e.g. hitting Enter mid-flow) while we're
    // not yet on the final step, treat it as "advance to next step" instead
    // of submitting.
    if (regStep < REG_STEPS) {
      goToRegStep(regStep + 1);
      return;
    }

    setLoading(true);

    try {
      // Shaped to match businessModel.ts EXACTLY, since a mismatched key here
      // (e.g. "services" instead of "servicesProvided") silently saves as an
      // empty array/default and Aria's bot will think the shop has no data.
      const payload = {
        name: regData.businessName,       // business/shop name -> schema "name"
        ownerName: regData.name,          // admin's personal name -> schema "ownerName"
        email: regData.email,
        password: regData.password,
        phone: regData.phone,
        businessType: regData.businessType,
        city: regData.city,
        hours: {
          opens: regData.openingHours || "10:00 AM",
          closes: regData.closingHours || "08:00 PM",
        },
        servicesProvided: regData.services
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        telegramBotToken: regData.telegramBotToken,
      };

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success || res.ok) {
        localStorage.setItem('aria_auth_token', data.token);
        localStorage.setItem('tenantToken', data.token);

        if (data.business) {
          localStorage.setItem('businessMeta', JSON.stringify(data.business));
          localStorage.setItem('aria_business_id', data.business.id || data.business._id || '');
        }

        localStorage.setItem('aria_user_email', regData.email);
        localStorage.setItem('aria_user_name', regData.name);

        // Fallback in case the backend response doesn't echo `business` back yet
        if (!data.business) {
          localStorage.setItem('businessMeta', JSON.stringify({
            id: '',
            _id: '',
            name: regData.businessName,
            type: regData.businessType,
          }));
        }

        setToken(data.token);
        window.location.reload();
      } else {
        setErrorMsg(data.message || 'Ecosystem deployment registration rejected.');
      }
    } catch (err) {
      setErrorMsg('Network transmission failure. Verify backend server routing status.');
    } finally {
      setLoading(false);
    }
  };

  // Render Login screen if not authenticated
  if (!token) {
    return (
      <div className="relative min-h-screen bg-ink font-body text-text-on-paper flex items-center justify-center p-6 selection:bg-[#d9a05b]/20 overflow-hidden">
        {/* Mobile / tablet — static image */}
        <img
          src="/aria.png"
          alt="Aria, your AI employee"
          className="block md:hidden absolute inset-0 w-full h-full object-cover object-[62%_26%]"
        />
        {/* Desktop — looping video */}
        <video
          className="hidden md:block absolute inset-0 w-full h-full object-cover object-[100%_20%]"
          src="/aria2.mp4"
          poster="/aria-hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
        />

        {/* Same scrim treatment as the landing page hero */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 md:via-ink/70 to-ink/35 md:to-ink/15" />
        <div className="absolute inset-0 bg-[radial-gradient(800px_420px_at_85%_-10%,rgba(217,142,43,0.18),transparent_60%)]" />
        {/* Extra dark wash so the form card stays legible over motion */}
        <div className="absolute inset-0 bg-ink/45" />

        {/* --- CARD: solid black box, cream text throughout --- */}
        <div className="w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-8 relative overflow-hidden z-10">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#d9a05b]" />

          <div className="flex items-center justify-center space-x-2 mb-8 mt-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3ab795] animate-pulse" />
            <span className="font-display font-bold text-[22px] text-[#faf6ec] tracking-tight">Aria Console</span>
          </div>

          <div className="flex justify-center space-x-1 mb-6 bg-white/5 p-1 rounded-xl">
            <button
              type="button"
              className={`flex-1 text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg transition-all duration-200 ${authTab === 'login' ? 'bg-[#d9a05b] text-ink shadow-sm' : 'text-[#faf6ec]/80 hover:text-[#faf6ec]'}`}
              onClick={() => { setAuthTab('login'); setErrorMsg(''); setRegStep(1); }}
              disabled={loading}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg transition-all duration-200 ${authTab === 'register' ? 'bg-[#d9a05b] text-ink shadow-sm' : 'text-[#faf6ec]/80 hover:text-[#faf6ec]'}`}
              onClick={() => { setAuthTab('register'); setErrorMsg(''); setRegStep(1); }}
              disabled={loading}
            >
              Register Shop
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-mono animate-in fade-in duration-200">
              ⚠️ {errorMsg}
            </div>
          )}

          {authTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-1">Business Email</label>
                <input
                  type="email" required
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                  value={loginData.email}
                  onChange={e => setLoginData({...loginData, email: e.target.value})}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password" required
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                  value={loginData.password}
                  onChange={e => setLoginData({...loginData, password: e.target.value})}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#d9a05b] hover:bg-[#d9a05b]/90 text-ink font-semibold p-3.5 rounded-xl transition mt-4 shadow-sm text-sm tracking-tight disabled:opacity-50 transform active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? 'Verifying Workspace Session...' : 'Access Workspace →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">

              {/* Step indicator — now shown on ALL screen sizes */}
              <div className="mb-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-[#faf6ec]/60 uppercase tracking-widest">
                    Step {regStep} of {REG_STEPS}
                  </span>
                  <span className="text-[10px] font-bold text-[#d9a05b] uppercase tracking-widest">
                    {regStep === 1 ? 'Your Details' : regStep === 2 ? 'Shop Details' : 'Inventory'}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: REG_STEPS }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        i + 1 <= regStep ? 'bg-[#d9a05b]' : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Fields wrapper — one short step shown at a time on every screen size */}
              <div className="space-y-3.5">

                {/* --- STEP 1: Identity --- */}
                <div className={`space-y-3.5 ${regStep === 1 ? 'block' : 'hidden'}`}>
                  <div>
                    <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Full Name *</label>
                    <input
                      type="text" required placeholder="Rina Deshmukh"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                      value={regData.name}
                      onChange={e => setRegData({...regData, name: e.target.value})}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Email Address *</label>
                    <input
                      type="email" required
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                      value={regData.email}
                      onChange={e => setRegData({...regData, email: e.target.value})}
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Mobile Number *</label>
                      <input
                        type="text" required placeholder="+91 98xxx xxxxx"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                        value={regData.phone}
                        onChange={e => setRegData({...regData, phone: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Password *</label>
                      <input
                        type="password" required minLength={6}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                        value={regData.password}
                        onChange={e => setRegData({...regData, password: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* --- STEP 2: Shop Details --- */}
                <div className={`space-y-3.5 ${regStep === 2 ? 'block' : 'hidden'}`}>
                  <div className="border-t border-white/10 pt-3 mt-1">
                    <p className="text-[10px] font-bold text-[#d9a05b] uppercase tracking-widest mb-2">Shop Details</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Business Name *</label>
                    <input
                      type="text" required placeholder="Rina Salon"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                      value={regData.businessName}
                      onChange={e => setRegData({...regData, businessName: e.target.value})}
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Business Type *</label>
                      <input
                        type="text" required placeholder="e.g., Salon / Spa"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                        value={regData.businessType}
                        onChange={e => setRegData({...regData, businessType: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">City Location</label>
                      <input
                        type="text" placeholder="Pune"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                        value={regData.city}
                        onChange={e => setRegData({...regData, city: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Operating Hours</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text" placeholder="Opens — 10:00 AM"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                        value={regData.openingHours}
                        onChange={e => setRegData({...regData, openingHours: e.target.value})}
                        disabled={loading}
                      />
                      <input
                        type="text" placeholder="Closes — 8:00 PM"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                        value={regData.closingHours}
                        onChange={e => setRegData({...regData, closingHours: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                    <p className="text-[10px] text-[#faf6ec]/55 mt-1">
                      Aria locks scheduling blocks within this timeframe unless overridden later in Settings.
                    </p>
                  </div>
                </div>

                {/* --- STEP 3: Inventory & Integrations --- */}
                <div className={`space-y-3.5 ${regStep === 3 ? 'block' : 'hidden'}`}>
                  <div>
                    <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Services / Products Inventory</label>
                    <textarea
                      placeholder="Haircut, hair spa, facial, bridal package..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50 resize-none"
                      value={regData.services}
                      onChange={e => setRegData({...regData, services: e.target.value})}
                      disabled={loading}
                    />
                    <p className="text-[10px] text-[#faf6ec]/55 mt-1">
                      Comma-separated. Aria reads this to confirm inventory or menu availability to customers.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Telegram Bot Token (Optional)</label>
                    <input
                      type="text" placeholder="123456:ABCdef..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                      value={regData.telegramBotToken}
                      onChange={e => setRegData({...regData, telegramBotToken: e.target.value})}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* --- Navigation: Back / Continue / Deploy, identical on mobile and desktop --- */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => goToRegStep(regStep - 1)}
                  disabled={loading}
                  className={`${regStep === 1 ? 'hidden' : 'flex'} items-center justify-center px-4 py-3.5 rounded-xl border border-white/10 text-[#faf6ec]/80 text-sm font-medium hover:bg-white/5 transition disabled:opacity-50`}
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => goToRegStep(regStep + 1)}
                  disabled={loading}
                  className={`${regStep < REG_STEPS ? 'flex' : 'hidden'} flex-1 items-center justify-center bg-[#d9a05b] hover:bg-[#d9a05b]/90 text-ink font-semibold p-3.5 rounded-xl transition shadow-sm text-sm tracking-tight disabled:opacity-50 transform active:scale-[0.98]`}
                >
                  Continue →
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className={`${regStep === REG_STEPS ? 'flex' : 'hidden'} flex-1 items-center justify-center bg-[#d9a05b] hover:bg-[#d9a05b]/90 text-ink font-semibold p-3.5 rounded-xl transition shadow-sm text-sm tracking-tight disabled:opacity-50 transform active:scale-[0.98]`}
                >
                  {loading ? 'Provisioning Micro-Services...' : 'Deploy Shop Ecosystem →'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Render dashboard workspace ONLY when token verification and key hydration are absolute
  return <AuthenticatedDashboard setToken={setToken} />;
}

// --- ISOLATED AUTHENTICATED WORKSPACE COMPONENT ---
function AuthenticatedDashboard({ setToken }: { setToken: (t: string | null) => void }) {
  const [view, setView] = useState('overview');

  // Hook safely initializes now because localStorage conditions are verified
  const {
    appointments,
    loadingAppts,
    apptError,
    business,
    businessPhone,
    greeting,
    toggles,
    toggle,
    loadAppointments,
    handleAddAppointment,
    handleCancelAppointment,
    handleCompleteAppointment, // ◄ FIX: was missing, which is why <Appointments> received undefined for onComplete
  } = useDashboard();

  const handleLogout = () => {
    localStorage.removeItem('aria_auth_token');
    localStorage.removeItem('aria_business_id');
    localStorage.removeItem('aria_user_id');
    localStorage.removeItem('aria_user_email');
    localStorage.removeItem('aria_user_name');
    localStorage.removeItem('tenantToken');
    localStorage.removeItem('businessMeta');

    setToken(null);
    window.location.reload();
  };

  const renderView = () => {
    switch (view) {
      case 'overview':
        return <Overview appointments={appointments} loadingAppts={loadingAppts} business={business} greeting={greeting} />;
      case 'appointments':
        return (
          <Appointments
            appointments={appointments}
            loadingAppts={loadingAppts}
            apptError={apptError}
            onAdd={handleAddAppointment}
            onCancel={handleCancelAppointment}
            onComplete={handleCompleteAppointment} // ◄ FIX: this was never passed down, so the button fired `undefined(id)`
            loadAppointments={loadAppointments}
          />
        );
      case 'reports': return <Reports />;
      case 'calls': return <Calls />;
      case 'whatsapp': return <WhatsApp />;
      case 'orders': return <Orders />;
      case 'leads': return <Leads />;
      case 'settings':
        return <Settings business={business} businessPhone={businessPhone} toggles={toggles} toggle={toggle} />;
      case 'billing': return <Billing />;
      default:
        return (
          <div className="text-center text-text-on-paper-dim font-mono text-[13px] py-12">
            View workspace segment not found
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-paper font-body text-text-on-paper flex selection:bg-[#d9a05b]/20">
      <Sidebar view={view} setView={setView} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="flex-shrink-0 h-[72px] bg-paper/85 backdrop-blur-md border-b border-ink/10 flex items-center justify-between px-8 z-40 lg:pl-8 pl-20">
          <div>
            <h1 className="font-display font-bold text-[20px] text-ink tracking-tight capitalize inline-block">
              {view}
            </h1>
            {business?.name && (
              <span className="ml-3 text-xs opacity-60 font-mono hidden sm:inline-block">
                ({business.name})
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="text-xs bg-ink/5 hover:bg-rose-500/10 text-text-on-paper hover:text-rose-600 border border-ink/10 hover:border-rose-500/20 px-3.5 py-2 rounded-lg transition duration-200 font-medium"
          >
            Sign Out
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1180px] mx-auto">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}