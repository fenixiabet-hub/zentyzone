/**
 * Zentyzone — Pantalla de inicio (Landing)
 */
import { useState } from 'react';
import {
  Menu,
  X,
  ArrowRight,
  Sparkles,
  Check,
  Heart,
  Clock,
  Users,
  Shield,
  Zap,
  BookOpen,
  Coffee,
  Star,
} from 'lucide-react';
import { C } from '../theme';
import { t, type Lang } from '../translations';
import { Logo } from './Logo';
import { LangToggle } from './LangToggle';

interface LandingProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
  onGetStarted: () => void;
}

export function Landing({ lang, setLang, onGetStarted }: LandingProps) {
  const L = t[lang];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif", background: C.cream, color: C.brown }}
    >
      {/* Soft decorative blobs */}
      <div
        className="fixed top-0 right-0 w-[700px] h-[700px] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${C.mustardSoft} 0%, transparent 70%)`,
          transform: 'translate(30%, -30%)',
        }}
      />
      <div
        className="fixed bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${C.oliveSoft} 0%, transparent 70%)`,
          transform: 'translate(-30%, 30%)',
        }}
      />

      {/* Nav */}
      <nav
        className="relative z-20 sticky top-0 backdrop-blur-md"
        style={{ background: 'rgba(251, 247, 238, 0.85)', borderBottom: `1px solid ${C.creamWarm}` }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <Logo size={42} />
              <div className="flex flex-col leading-none">
                <span
                  className="text-xl tracking-tight"
                  style={{ fontWeight: 700, color: C.brown, letterSpacing: '-0.01em' }}
                >
                  Zentyzone
                </span>
                <span
                  className="text-[10px] uppercase tracking-[0.18em] mt-1"
                  style={{ color: C.brownLight }}
                >
                  For RBT Professionals
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: C.brownSoft }}>
              <a href="#features" className="hover:opacity-70 transition-opacity">
                {L.features}
              </a>
              <a href="#how" className="hover:opacity-70 transition-opacity">
                {L.how}
              </a>
              <a href="#pricing" className="hover:opacity-70 transition-opacity">
                {L.pricing}
              </a>
              <LangToggle lang={lang} setLang={setLang} />
              <button
                onClick={onGetStarted}
                className="font-medium hover:opacity-70 transition-opacity"
                style={{ color: C.brown }}
              >
                {L.signIn}
              </button>
              <button
                onClick={onGetStarted}
                className="px-5 py-2.5 rounded-full text-sm transition-all hover:shadow-lg flex items-center gap-1.5"
                style={{ background: C.brown, color: C.cream, fontWeight: 600 }}
              >
                {L.getStarted}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
              style={{ color: C.brown }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3" style={{ borderTop: `1px solid ${C.creamWarm}` }}>
              <a href="#features" className="block py-2" style={{ color: C.brownSoft }}>
                {L.features}
              </a>
              <a href="#how" className="block py-2" style={{ color: C.brownSoft }}>
                {L.how}
              </a>
              <a href="#pricing" className="block py-2" style={{ color: C.brownSoft }}>
                {L.pricing}
              </a>
              <LangToggle lang={lang} setLang={setLang} />
              <button
                onClick={() => {
                  onGetStarted();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-5 py-3 rounded-full text-sm mt-2"
                style={{ background: C.brown, color: C.cream, fontWeight: 600 }}
              >
                {L.getStarted}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-20 lg:pt-28 pb-24">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs mb-8"
              style={{ background: 'white', border: `1px solid ${C.creamWarm}`, color: C.brownSoft }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: C.mustard }}
              ></span>
              <span style={{ fontWeight: 500 }}>{L.badge}</span>
            </div>

            <h1
              className="text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-3"
              style={{ fontWeight: 700, color: C.brown, letterSpacing: '-0.025em' }}
            >
              {L.heroTitle1}
            </h1>
            <h1
              className="text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-8"
              style={{ fontWeight: 700, color: C.mustardDark, letterSpacing: '-0.025em' }}
            >
              {L.heroTitle2}
            </h1>

            <div
              className="mb-6 flex items-center gap-2"
              style={{ fontFamily: "'Caveat', cursive", color: C.mustardDark, fontSize: '1.5rem' }}
            >
              <Sparkles className="w-5 h-5" style={{ color: C.mustardDark }} />
              <span>{L.heroEmotion}</span>
            </div>

            <p className="text-lg md:text-xl max-w-xl leading-relaxed mb-10" style={{ color: C.brownSoft }}>
              {L.heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onGetStarted}
                className="px-7 py-4 rounded-full transition-all hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 group"
                style={{
                  background: C.brown,
                  color: C.cream,
                  fontWeight: 600,
                  boxShadow: `0 8px 20px ${C.brown}30`,
                }}
              >
                {L.heroCta1}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                className="px-7 py-4 rounded-full transition-all hover:bg-white"
                style={{
                  background: 'transparent',
                  border: `1.5px solid ${C.creamWarm}`,
                  color: C.brown,
                  fontWeight: 500,
                }}
              >
                {L.heroCta2}
              </button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm" style={{ color: C.brownLight }}>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4" strokeWidth={2.5} style={{ color: C.olive }} />
                {L.heroProof1}
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4" strokeWidth={2.5} style={{ color: C.olive }} />
                {L.heroProof2}
              </div>
            </div>
          </div>

          {/* Hero card */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div
                className="absolute -inset-8 rounded-[3rem] blur-3xl opacity-50"
                style={{
                  background: `radial-gradient(circle, ${C.mustardSoft} 0%, ${C.oliveSoft}40 100%)`,
                }}
              ></div>

              <div
                className="relative rounded-[2rem] overflow-hidden"
                style={{
                  background: 'white',
                  boxShadow: `0 30px 60px -20px ${C.mustardDark}25, 0 18px 36px -18px ${C.mustardDark}15`,
                }}
              >
                <div
                  className="px-6 py-4 flex items-center gap-3"
                  style={{ borderBottom: `1px solid ${C.creamSoft}` }}
                >
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: C.creamWarm }}></div>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: C.creamWarm }}></div>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: C.creamWarm }}></div>
                  </div>
                  <span
                    className="text-[11px]"
                    style={{ color: C.brownLight, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    session-note
                  </span>
                  <div
                    className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: C.creamSoft, color: C.brownSoft }}
                  >
                    <span
                      className="w-1 h-1 rounded-full animate-pulse"
                      style={{ background: C.mustard }}
                    ></span>
                    live
                  </div>
                </div>
                <div className="p-7 text-sm leading-relaxed" style={{ color: C.brown }}>
                  <div
                    className="text-xs mb-4"
                    style={{ color: C.brownLight, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    session 04 · 11:32 AM
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <span style={{ color: C.mustardDark, fontWeight: 600 }}>Client:</span> J.D.
                    </div>
                    <div>
                      <span style={{ color: C.mustardDark, fontWeight: 600 }}>Duration:</span> 120 min
                    </div>
                  </div>
                  <div className="mt-4 leading-relaxed">
                    Conducted DTT trials targeting receptive identification of{' '}
                    <span
                      className="px-1.5 py-0.5 rounded-md"
                      style={{ background: `${C.mustardSoft}80`, color: C.mustardDark, fontWeight: 500 }}
                    >
                      common objects
                    </span>{' '}
                    with <span style={{ fontWeight: 600 }}>80% independent accuracy</span> across 10
                    trials...
                  </div>
                  <div
                    className="mt-5 flex items-center gap-2 text-xs px-3 py-2 rounded-2xl"
                    style={{ background: C.creamSoft, color: C.brownSoft }}
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ color: C.mustardDark }} />
                    <span style={{ fontWeight: 500 }}>Generated in 2.4s</span>
                    <span className="ml-auto" style={{ color: C.brownLight }}>
                      · ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating handwritten badge */}
              <div
                className="absolute -bottom-4 -right-2 px-5 py-2.5 rounded-full"
                style={{
                  background: C.mustard,
                  color: C.brown,
                  fontFamily: "'Caveat', cursive",
                  fontSize: '1.4rem',
                  transform: 'rotate(-3deg)',
                  boxShadow: `0 10px 25px -5px ${C.mustardDark}40`,
                }}
              >
                ¡se siente bien!
              </div>

              {/* Floating sun */}
              <div
                className="absolute -top-6 -left-4 w-14 h-14 rounded-3xl flex items-center justify-center"
                style={{
                  background: 'white',
                  boxShadow: `0 10px 25px ${C.mustardDark}25`,
                  transform: 'rotate(-8deg)',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="4" fill={C.mustard} />
                  <path
                    d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2"
                    stroke={C.mustard}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10" style={{ background: 'white' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
          <div className="max-w-2xl mb-16">
            <div
              className="text-xs uppercase tracking-[0.2em] mb-4"
              style={{ color: C.mustardDark, fontWeight: 600 }}
            >
              — {L.featuresKicker}
            </div>
            <h2
              className="text-4xl md:text-5xl tracking-tight"
              style={{ fontWeight: 700, color: C.brown, letterSpacing: '-0.02em', lineHeight: 1.1 }}
            >
              {L.featuresTitle1}
              <br />
              <span style={{ color: C.mustardDark }}>{L.featuresTitle2}</span>.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Zap, title: L.f1Title, desc: L.f1Desc },
              { icon: BookOpen, title: L.f2Title, desc: L.f2Desc },
              { icon: Shield, title: L.f3Title, desc: L.f3Desc },
              { icon: Clock, title: L.f4Title, desc: L.f4Desc },
              { icon: Users, title: L.f5Title, desc: L.f5Desc },
              { icon: Heart, title: L.f6Title, desc: L.f6Desc },
            ].map((f, i) => (
              <div
                key={i}
                className="p-7 rounded-[2rem] transition-all hover:shadow-lg hover:-translate-y-0.5 group"
                style={{ background: C.cream, border: `1px solid ${C.creamWarm}` }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-all group-hover:scale-105"
                  style={{ background: 'white' }}
                >
                  <f.icon className="w-5 h-5" strokeWidth={2} style={{ color: C.mustardDark }} />
                </div>
                <h3
                  className="text-xl mb-2"
                  style={{ fontWeight: 700, color: C.brown, letterSpacing: '-0.01em' }}
                >
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: C.brownSoft }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="relative z-10" style={{ background: C.creamSoft }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-4">
              <div
                className="text-xs uppercase tracking-[0.2em] mb-4"
                style={{ color: C.mustardDark, fontWeight: 600 }}
              >
                — {L.howKicker}
              </div>
              <h2
                className="text-4xl md:text-5xl tracking-tight mb-6"
                style={{ fontWeight: 700, color: C.brown, letterSpacing: '-0.02em', lineHeight: 1.1 }}
              >
                {L.howTitle}
              </h2>
              <p className="leading-relaxed" style={{ color: C.brownSoft }}>
                {L.howSubtitle}
              </p>
              <div
                className="mt-8 inline-flex items-center gap-2 px-4 py-2.5 rounded-full"
                style={{ background: 'white' }}
              >
                <Coffee className="w-4 h-4" style={{ color: C.mustardDark }} />
                <span
                  style={{ fontFamily: "'Caveat', cursive", fontSize: '1.2rem', color: C.mustardDark }}
                >
                  {L.breathe}
                </span>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              {[
                { n: '01', t: L.s1Title, d: L.s1Desc },
                { n: '02', t: L.s2Title, d: L.s2Desc },
                { n: '03', t: L.s3Title, d: L.s3Desc },
              ].map((s, i) => (
                <div
                  key={i}
                  className="p-7 rounded-[2rem] flex gap-6 items-start transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{ background: 'white' }}
                >
                  <div
                    className="text-3xl shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: C.mustardSoft, color: C.mustardDark, fontWeight: 700 }}
                  >
                    {s.n}
                  </div>
                  <div className="flex-1 pt-1">
                    <h3
                      className="text-xl mb-2"
                      style={{ fontWeight: 700, color: C.brown, letterSpacing: '-0.01em' }}
                    >
                      {s.t}
                    </h3>
                    <p style={{ color: C.brownSoft }}>{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="relative z-10" style={{ background: 'white' }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-12 py-24 text-center">
          <div className="flex justify-center gap-1 mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5" style={{ fill: C.mustard, color: C.mustard }} />
            ))}
          </div>
          <blockquote
            className="text-2xl md:text-3xl leading-relaxed mb-8"
            style={{ color: C.brown, fontWeight: 500, lineHeight: 1.4, letterSpacing: '-0.01em' }}
          >
            "{L.testimonialQuote}"
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: C.mustardSoft, color: C.mustardDark, fontWeight: 700 }}
            >
              M
            </div>
            <div className="text-sm text-left" style={{ color: C.brownLight }}>
              <div style={{ color: C.brown, fontWeight: 600 }}>{L.testimonialName}</div>
              <div>{L.testimonialRole}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="relative z-10" style={{ background: C.brown }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div
                className="mb-4"
                style={{ fontFamily: "'Caveat', cursive", color: C.mustard, fontSize: '1.5rem' }}
              >
                ✨ tu turno
              </div>
              <h2
                className="text-4xl md:text-5xl tracking-tight mb-6"
                style={{ fontWeight: 700, color: C.cream, lineHeight: 1.1, letterSpacing: '-0.02em' }}
              >
                {L.ctaTitle1}
                <br />
                <span style={{ color: C.mustard }}>{L.ctaTitle2}</span>.
              </h2>
              <p className="text-lg leading-relaxed" style={{ color: C.creamWarm }}>
                {L.ctaSubtitle}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 lg:justify-end">
              <button
                onClick={onGetStarted}
                className="px-7 py-4 rounded-full transition-all hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 group"
                style={{ background: C.mustard, color: C.brown, fontWeight: 600 }}
              >
                {L.ctaButton}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                className="px-7 py-4 rounded-full transition-colors"
                style={{ border: `1.5px solid ${C.brownSoft}`, color: C.cream, fontWeight: 500 }}
              >
                {L.ctaSecondary}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10" style={{ background: '#2a241d', color: C.brownLight }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <span style={{ color: C.cream, fontWeight: 700 }}>Zentyzone</span>
            <span style={{ color: C.brownSoft }}>·</span>
            <span>© 2026</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:opacity-70 transition-opacity">
              Privacy
            </a>
            <a href="#" className="hover:opacity-70 transition-opacity">
              Terms
            </a>
            <a href="#" className="hover:opacity-70 transition-opacity">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
