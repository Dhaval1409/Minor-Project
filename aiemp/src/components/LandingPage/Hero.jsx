export default function Hero() {
  return (
    <section className="bg-paper py-20 overflow-hidden">
      <div className="max-w-[1180px] mx-auto px-8 grid md:grid-cols-2 gap-14 items-center">
        <div>
          <div className="flex items-center gap-2 font-mono text-[12.5px] uppercase tracking-[0.08em] text-emerald font-semibold mb-6">
            <span className="w-2 h-2 bg-emerald rounded-full"></span>
            Now hiring — starts today
          </div>
          <h1 className="font-display font-bold text-5xl md:text-[58px] leading-[1.04] tracking-[-0.02em] text-ink">
            Hire an AI<br />employee for<br />
            <span className="text-amber">₹1,999/month.</span>
          </h1>
          <p className="mt-6 text-lg text-text-on-paper-dim max-w-[460px] leading-relaxed">
            Aria answers your phone, replies on WhatsApp, books appointments, and follows up with every lead — while you run the shop.
          </p>
          <div className="flex gap-4 mt-8 flex-wrap">
            <button className="bg-ink text-text-on-ink px-8 py-4 rounded-full font-semibold hover:opacity-90 transition">
              Hire Aria today →
            </button>
            <button className="border-2 border-gray-200 px-8 py-4 rounded-full font-semibold text-ink">
              Hear a sample call
            </button>
          </div>
        </div>
        
        {/* Badge Component would go here */}
      </div>
    </section>
  );
}