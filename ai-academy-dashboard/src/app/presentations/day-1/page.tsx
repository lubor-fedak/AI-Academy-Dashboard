'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// CSS Variables as constants
const colors = {
  bgDark: '#0a0a0f',
  bgCard: '#12121a',
  accentBlue: '#3b82f6',
  accentPurple: '#8b5cf6',
  accentCyan: '#06b6d4',
  accentGreen: '#10b981',
  accentOrange: '#f59e0b',
  accentRed: '#ef4444',
  accentPink: '#ec4899',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  borderColor: '#1e293b',
};

const sections = [
  { id: 'hero', label: 'Start' },
  { id: 'journey', label: 'Journey' },
  { id: 'tshape', label: 'T-Shape' },
  { id: 'roles', label: 'Roles' },
  { id: 'landscape', label: 'AI 2026' },
  { id: 'kaf', label: 'KAF' },
  { id: 'prompts', label: 'Prompts' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'tools', label: 'Tools' },
  { id: 'exercises', label: 'Exercises' },
  { id: 'summary', label: 'Summary' },
];

export default function Day1PresentationPage() {
  const [activeSection, setActiveSection] = useState('hero');
  const [progress, setProgress] = useState(0);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const scrollToSection = useCallback((sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 100;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress((window.scrollY / docHeight) * 100);

      sections.forEach(({ id }) => {
        const element = sectionRefs.current[id];
        if (element) {
          const top = element.offsetTop;
          const bottom = top + element.offsetHeight;
          if (scrollPos >= top && scrollPos < bottom) {
            setActiveSection(id);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = sections.findIndex(s => s.id === activeSection);
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        if (currentIndex < sections.length - 1) {
          scrollToSection(sections[currentIndex + 1].id);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (currentIndex > 0) {
          scrollToSection(sections[currentIndex - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, scrollToSection]);

  const scrollNext = () => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex < sections.length - 1) {
      scrollToSection(sections[currentIndex + 1].id);
    }
  };

  const scrollPrev = () => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex > 0) {
      scrollToSection(sections[currentIndex - 1].id);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: colors.bgDark, color: colors.textPrimary, lineHeight: 1.6 }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(10, 10, 15, 0.95)', borderBottom: `1px solid ${colors.borderColor}`, padding: '0.75rem 2rem' }}>
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <Link href="/mission/day/1" className="font-bold text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${colors.accentBlue}, ${colors.accentPurple})` }}>
            AI Academy 2026
          </Link>
          <div className="hidden md:flex gap-2 flex-wrap">
            {sections.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`text-sm px-3 py-1.5 rounded-md transition-all ${activeSection === id ? 'text-white' : ''}`}
                style={{
                  color: activeSection === id ? colors.textPrimary : colors.textSecondary,
                  background: activeSection === id ? colors.bgCard : 'transparent',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 h-0.5 transition-all" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${colors.accentBlue}, ${colors.accentPurple})` }} />
      </nav>

      {/* Hero Section */}
      <section
        ref={el => { sectionRefs.current['hero'] = el; }}
        id="hero"
        className="min-h-screen flex flex-col justify-center items-center text-center relative px-8 pt-24 pb-16"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none" style={{ background: `radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)` }} />

        <div className="max-w-[1200px] mx-auto relative z-10">
          <span className="inline-block px-4 py-2 rounded-full text-sm mb-8" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}`, color: colors.accentCyan }}>
            Day 1 &bull; February 2, 2026
          </span>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            The <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${colors.accentBlue}, ${colors.accentPurple})` }}>New Reality</span>
          </h1>

          <p className="text-xl md:text-2xl mb-12" style={{ color: colors.textSecondary }}>
            Forget everything you knew about AI.<br />Year 2026. Agents no longer assist. <strong className="text-white">Agents act.</strong>
          </p>

          <div className="text-left max-w-[700px] mx-auto p-6 rounded-r-xl" style={{ background: colors.bgCard, borderLeft: `4px solid ${colors.accentPurple}` }}>
            <p className="italic mb-2" style={{ color: colors.textSecondary }}>
              &ldquo;Europe is falling behind. Not because we lack talent. But because we&apos;re still learning AI from 2023. The world has moved on. You must move with it.&rdquo;
            </p>
            <cite style={{ color: colors.accentPurple, fontSize: '0.9rem' }}>— EU Commissioner, Opening Briefing</cite>
          </div>

          <div className="mt-12">
            <button
              onClick={() => scrollToSection('journey')}
              className="px-6 py-3 rounded-lg font-medium transition-all hover:-translate-y-0.5"
              style={{ background: `linear-gradient(135deg, ${colors.accentBlue}, ${colors.accentPurple})`, color: 'white' }}
            >
              Begin Your Journey →
            </button>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section
        ref={el => { sectionRefs.current['journey'] = el; }}
        id="journey"
        className="min-h-screen flex flex-col justify-center px-8 py-24"
      >
        <div className="max-w-[1200px] mx-auto w-full">
          <SectionHeader number="01" title="Your 25-Day Journey" subtitle="This isn't a lecture series. It's a transformation program." />

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { value: '25', label: 'Training Days' },
              { value: '200+', label: 'Participants' },
              { value: '7', label: 'AI Roles' },
              { value: '1', label: 'Client Hackathon' },
            ].map(stat => (
              <div key={stat.label} className="text-center p-6 rounded-xl" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}` }}>
                <div className="text-4xl font-bold text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${colors.accentBlue}, ${colors.accentPurple})` }}>{stat.value}</div>
                <div className="text-sm mt-2" style={{ color: colors.textSecondary }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Timeline */}
            <div className="relative pl-12">
              <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: `linear-gradient(to bottom, ${colors.accentBlue}, ${colors.accentPurple}, ${colors.accentPink})` }} />
              {[
                { week: 'WEEK 1 (Feb 2-8)', title: 'Foundations', desc: 'AI Landscape, Prompt Engineering, Agentic Patterns, Role Introduction' },
                { week: 'WEEK 2 (Feb 9-15)', title: 'Role Deep Dive', desc: 'Specialization in your chosen role with real scenarios' },
                { week: 'WEEK 3 (Feb 16-22)', title: 'Spring Break', desc: 'Self-paced catch-up, exploration, certification prep' },
                { week: 'WEEKS 4-5 (Feb 23-Mar 14)', title: 'Team Projects', desc: 'Cross-functional teams building production-ready AI solutions' },
                { week: 'WEEK 6 (Mar 15)', title: 'Hackathon & Graduation', desc: 'Client presentation, demo day, certification' },
              ].map((item, i) => (
                <div key={i} className="relative pb-8">
                  <div className="absolute -left-12 top-1.5 w-3 h-3 rounded-full" style={{ background: colors.accentBlue, border: `3px solid ${colors.bgDark}` }} />
                  <div className="text-xs font-semibold mb-1" style={{ color: colors.accentBlue }}>{item.week}</div>
                  <div className="font-semibold mb-1">{item.title}</div>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>{item.desc}</div>
                </div>
              ))}
            </div>

            {/* Daily Format */}
            <div>
              <div className="p-6 rounded-2xl mb-4" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}` }}>
                <h3 className="font-semibold mb-4">Daily Format</h3>
                <div className="space-y-2">
                  <div className="flex gap-4"><strong>90 min</strong><span style={{ color: colors.textSecondary }}>Live Session (mentor-facilitated)</span></div>
                  <div className="flex gap-4"><strong>90 min</strong><span style={{ color: colors.textSecondary }}>Self-Study (with AI Tutor)</span></div>
                </div>
              </div>
              <div className="p-6 rounded-xl" style={{ background: `rgba(245, 158, 11, 0.1)`, border: `1px solid ${colors.accentOrange}` }}>
                <h4 className="font-semibold mb-2" style={{ color: colors.accentOrange }}>Key Difference</h4>
                <p style={{ color: colors.textSecondary }}>No lectures. No slides (mostly). Real situations, real decisions. AI Tutor as your learning partner.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* T-Shape Section */}
      <section
        ref={el => { sectionRefs.current['tshape'] = el; }}
        id="tshape"
        className="min-h-screen flex flex-col justify-center px-8 py-24"
      >
        <div className="max-w-[1200px] mx-auto w-full">
          <SectionHeader number="02" title="T-Shaped Learning" subtitle="Broad foundations + Deep specialization = Client-ready consultant" />

          <div className="flex flex-col items-center max-w-[900px] mx-auto">
            {/* Horizontal bar */}
            <div className="flex justify-center w-full">
              {['Day 1: AI Landscape', 'Day 2: Prompts', 'Day 3: Agents', 'Day 4-5: Role Intro'].map((text, i) => (
                <div
                  key={i}
                  className="flex-1 p-4 text-center font-medium text-sm"
                  style={{ background: `rgba(59, 130, 246, 0.1)`, border: `2px solid ${colors.accentBlue}`, color: colors.accentBlue }}
                >
                  {text}
                </div>
              ))}
            </div>
            {/* Vertical stem */}
            <div className="flex flex-col w-[200px]">
              {[
                { text: 'Week 2: Deep Dive', color: colors.accentPurple },
                { text: 'Role-Specific Skills', color: colors.accentPurple },
                { text: 'Advanced Patterns', color: colors.accentPurple },
                { text: 'Team Projects', color: colors.accentPink },
                { text: 'Hackathon', color: colors.accentPink },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-4 text-center font-medium text-sm"
                  style={{ background: `${item.color}15`, border: `2px solid ${item.color}`, color: item.color }}
                >
                  {item.text}
                </div>
              ))}
            </div>

            <div className="text-center mt-8 space-y-2" style={{ color: colors.textSecondary }}>
              <p><strong style={{ color: colors.accentBlue }}>Horizontal Bar:</strong> Everyone learns the same foundations (Days 1-5)</p>
              <p><strong style={{ color: colors.accentPurple }}>Vertical Stem:</strong> Deep specialization in your role (Week 2+)</p>
              <p><strong style={{ color: colors.accentPink }}>Integration:</strong> Cross-functional collaboration (Weeks 4-6)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section
        ref={el => { sectionRefs.current['roles'] = el; }}
        id="roles"
        className="min-h-screen flex flex-col justify-center px-8 py-24"
      >
        <div className="max-w-[1200px] mx-auto w-full">
          <SectionHeader number="03" title="The 7 AI Roles" subtitle="Methodology for Rapid AI Solution Delivery" />

          {/* Methodology */}
          <div className="p-6 rounded-2xl mb-8" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}` }}>
            <h3 className="font-semibold mb-4">Why These 7 Roles?</h3>
            <p className="mb-6" style={{ color: colors.textSecondary }}>
              Based on Forward Deployed Engineering methodology (Palantir, Scale AI) and analysis of 50+ enterprise AI projects.
            </p>
            <div className="flex flex-wrap justify-between gap-4">
              {['Discovery', 'Co-Design', 'Build', 'Verify', 'Release', 'Operate'].map((step, i) => (
                <div key={step} className="flex-1 min-w-[100px] text-center p-4 rounded-xl relative" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2" style={{ background: `linear-gradient(135deg, ${colors.accentBlue}, ${colors.accentPurple})` }}>
                    {i + 1}
                  </div>
                  <div className="font-semibold text-sm">{step}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { code: 'FDE', name: 'Forward Deployed Engineer', focus: 'End-to-end delivery, customer-facing, rapid prototyping', color: colors.accentBlue },
              { code: 'AI-SE', name: 'AI Software Engineer', focus: 'Platform development, CI/CD, LLMOps, production systems', color: colors.accentPurple },
              { code: 'AI-PM', name: 'AI Product Manager', focus: 'Use-case framing, roadmaps, stakeholder management', color: colors.accentCyan },
              { code: 'AI-SEC', name: 'AI Security Consultant', focus: 'Threat modeling, red teaming, guardrails, compliance', color: colors.accentRed },
              { code: 'AI-FE', name: 'AI Front-End Developer', focus: 'AI-native UI, streaming, accessibility', color: colors.accentGreen },
              { code: 'AI-DS', name: 'AI Data Scientist', focus: 'Model evaluation, experiments, bias detection', color: colors.accentPink },
              { code: 'AI-DA', name: 'AI Data Analyst', focus: 'Data pipelines, KPIs, dashboards, ROI storytelling', color: colors.accentOrange },
            ].map(role => (
              <div key={role.code} className="p-6 rounded-xl relative overflow-hidden" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}` }}>
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: role.color }} />
                <div className="font-mono text-xs font-semibold mb-2" style={{ color: colors.textMuted }}>{role.code}</div>
                <div className="font-semibold mb-2">{role.name}</div>
                <div className="text-sm" style={{ color: colors.textSecondary }}>{role.focus}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Landscape Section */}
      <section
        ref={el => { sectionRefs.current['landscape'] = el; }}
        id="landscape"
        className="min-h-screen flex flex-col justify-center px-8 py-24"
      >
        <div className="max-w-[1200px] mx-auto w-full">
          <SectionHeader number="04" title="AI Landscape 2026" subtitle="This is not a chatbot. This is a new paradigm." />

          {/* Comparison */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="p-8 rounded-2xl" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}`, borderTop: `3px solid ${colors.accentRed}` }}>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span>❌</span> Year 2023
              </h3>
              <ul className="space-y-3" style={{ color: colors.textSecondary }}>
                <li className="flex items-start gap-2"><span style={{ color: colors.textMuted }}>→</span> Human → AI → Output</li>
                <li className="flex items-start gap-2"><span style={{ color: colors.textMuted }}>→</span> AI as assistant</li>
                <li className="flex items-start gap-2"><span style={{ color: colors.textMuted }}>→</span> Hallucinations as main problem</li>
                <li className="flex items-start gap-2"><span style={{ color: colors.textMuted }}>→</span> Prompt engineering is everything</li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}`, borderTop: `3px solid ${colors.accentGreen}` }}>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span>✅</span> Year 2026
              </h3>
              <ul className="space-y-3" style={{ color: colors.textSecondary }}>
                <li className="flex items-start gap-2"><span style={{ color: colors.textMuted }}>→</span> Agent → Agent → Agent → Output</li>
                <li className="flex items-start gap-2"><span style={{ color: colors.textMuted }}>→</span> AI as autonomous actor</li>
                <li className="flex items-start gap-2"><span style={{ color: colors.textMuted }}>→</span> Autonomy vs. control as challenge</li>
                <li className="flex items-start gap-2"><span style={{ color: colors.textMuted }}>→</span> Architecture and governance matter most</li>
              </ul>
            </div>
          </div>

          {/* Models Table */}
          <h3 className="text-center text-xl font-semibold mb-6">The New Generation of Models</h3>
          <div className="rounded-xl overflow-hidden mb-12" style={{ border: `1px solid ${colors.borderColor}` }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: colors.bgCard }}>
                  <th className="p-4 text-left text-xs uppercase font-semibold" style={{ color: colors.textMuted }}>Model</th>
                  <th className="p-4 text-left text-xs uppercase font-semibold" style={{ color: colors.textMuted }}>Version</th>
                  <th className="p-4 text-left text-xs uppercase font-semibold" style={{ color: colors.textMuted }}>What&apos;s New</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { model: 'GPT', version: '5.2 (5.3 announced)', news: 'Native multi-agent coordination' },
                  { model: 'Claude', version: '4.5 (4.7 announced)', news: 'Constitutional AI - model has "character"' },
                  { model: 'Gemini', version: '3.0', news: 'Unlimited context, native multimodal' },
                  { model: 'Llama', version: '4', news: 'Open-source parity with closed models' },
                ].map((row, i) => (
                  <tr key={row.model} className="hover:bg-opacity-50" style={{ borderBottom: i < 3 ? `1px solid ${colors.borderColor}` : 'none' }}>
                    <td className="p-4 font-semibold">{row.model}</td>
                    <td className="p-4" style={{ color: colors.textSecondary }}>{row.version}</td>
                    <td className="p-4" style={{ color: colors.textSecondary }}>{row.news}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Demo Cards */}
          <h3 className="text-center text-xl font-semibold mb-6">Live Demos</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🤖💬🤖', title: 'Moltbook', desc: 'Agents discuss among themselves. You just read.', link: 'https://moltbook.com' },
              { icon: '🖥️🤖', title: 'ClawdBot / OpenClaw', desc: 'Agent autonomously controlling a computer.', link: 'https://openclaw.ai' },
              { icon: '🏗️⚡', title: 'Multi-Agent MVP', desc: 'PM → UX → Frontend = Landing page in 5 minutes.', link: null },
            ].map(demo => (
              <div key={demo.title} className="rounded-2xl overflow-hidden transition-all hover:-translate-y-1" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}` }}>
                <div className="h-[180px] flex items-center justify-center text-5xl" style={{ background: `linear-gradient(135deg, ${colors.bgCard} 0%, #1a1a2e 100%)`, borderBottom: `1px solid ${colors.borderColor}` }}>
                  {demo.icon}
                </div>
                <div className="p-6">
                  <h4 className="font-semibold mb-2">{demo.title}</h4>
                  <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>{demo.desc}</p>
                  {demo.link ? (
                    <a href={demo.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium" style={{ color: colors.accentBlue }}>
                      Open Demo →
                    </a>
                  ) : (
                    <span className="text-sm font-medium" style={{ color: colors.accentOrange }}>🔴 Live Demo by Mentor</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KAF Section */}
      <section
        ref={el => { sectionRefs.current['kaf'] = el; }}
        id="kaf"
        className="min-h-screen flex flex-col justify-center px-8 py-24"
      >
        <div className="max-w-[1200px] mx-auto w-full">
          <SectionHeader number="05" title="Kyndryl Agentic AI Framework" subtitle="Enterprise-grade AI agents. Your competitive advantage." />

          <div className="grid lg:grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="font-semibold mb-4">What Customers Actually Ask</h3>
              {[
                '"How do I know the agent won\'t do something dangerous?"',
                '"Can I audit what decisions it made?"',
                '"How does this connect to our ServiceNow / SAP?"',
                '"Who\'s responsible when it fails at 2 AM?"',
              ].map((q, i) => (
                <div key={i} className="p-4 rounded-xl mb-3" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}`, borderLeft: `3px solid ${colors.accentOrange}` }}>
                  <p style={{ color: colors.textSecondary }}>{q}</p>
                </div>
              ))}
            </div>
            <div>
              <div className="p-6 rounded-xl" style={{ background: `rgba(16, 185, 129, 0.1)`, border: `1px solid ${colors.accentGreen}` }}>
                <h4 className="font-semibold mb-2" style={{ color: colors.accentGreen }}>The Key Insight</h4>
                <p style={{ color: colors.textSecondary }}>
                  <strong className="text-white">Agents are easy to build.</strong><br />
                  Agents that enterprises can trust are hard.
                </p>
                <p className="mt-4" style={{ color: colors.textSecondary }}>
                  <strong className="text-white">KAF solves the hard part:</strong> governance, orchestration, integration, accountability.
                </p>
              </div>
            </div>
          </div>

          {/* KAF Diagram */}
          <div className="p-8 rounded-2xl max-w-[900px] mx-auto" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}` }}>
            <h3 className="text-center text-xl font-bold mb-8 text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${colors.accentBlue}, ${colors.accentPurple})` }}>
              KYNDRYL AGENTIC AI FRAMEWORK
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                {
                  icon: '🔧',
                  name: 'Agent Builder',
                  desc: 'Design & configure',
                  tooltip: 'Visual no-code/low-code interface for designing AI agents. Supports GPT-5, Claude 4.5, Gemini 3.0, and Llama 4. Includes prompt templating, tool binding, and behavior testing sandbox.'
                },
                {
                  icon: '⚙️',
                  name: 'AI Core',
                  desc: 'Orchestration runtime',
                  tooltip: 'Multi-agent orchestration engine with automatic task decomposition, parallel execution, and conflict resolution. Handles agent-to-agent communication via standardized A2A protocol.'
                },
                {
                  icon: '📚',
                  name: 'Agent Registry',
                  desc: 'Discover & reuse',
                  tooltip: 'Enterprise catalog of pre-built and custom agents. Version control, dependency management, and one-click deployment. Includes 200+ certified agents for common enterprise tasks.'
                },
                {
                  icon: '🧠',
                  name: 'Memory',
                  desc: 'Context management',
                  tooltip: 'Unified memory layer with short-term (session), long-term (persistent), and shared (team) memory. Vector database integration with automatic RAG pipeline and context compression.'
                },
                {
                  icon: '🔌',
                  name: 'Connectors',
                  desc: 'ServiceNow, SAP, APIs',
                  tooltip: 'Pre-built integrations for 150+ enterprise systems including ServiceNow, SAP S/4HANA, Salesforce, and Microsoft 365. OAuth 2.1, API key management, and real-time sync.'
                },
                {
                  icon: '🛡️',
                  name: 'Governance',
                  desc: 'Security, audit, compliance',
                  tooltip: 'Complete audit trail of all agent decisions and actions. Role-based access control, data classification enforcement, EU AI Act compliance checks, and automated red-teaming.'
                },
              ].map(comp => (
                <div
                  key={comp.name}
                  className="group relative p-5 rounded-xl text-center transition-all cursor-pointer hover:scale-105"
                  style={{ background: `rgba(59, 130, 246, 0.05)`, border: `1px solid rgba(59, 130, 246, 0.2)` }}
                >
                  <div className="text-2xl mb-2">{comp.icon}</div>
                  <div className="font-semibold text-sm mb-1">{comp.name}</div>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>{comp.desc}</div>

                  {/* Tooltip */}
                  <div
                    className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none"
                    style={{
                      background: colors.bgDark,
                      border: `1px solid ${colors.accentBlue}`,
                      boxShadow: `0 4px 20px rgba(59, 130, 246, 0.3)`
                    }}
                  >
                    <div className="text-sm text-left" style={{ color: colors.textSecondary }}>
                      {comp.tooltip}
                    </div>
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                      style={{
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderTop: `8px solid ${colors.accentBlue}`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Prompts Section */}
      <section
        ref={el => { sectionRefs.current['prompts'] = el; }}
        id="prompts"
        className="min-h-screen flex flex-col justify-center px-8 py-24"
      >
        <div className="max-w-[1200px] mx-auto w-full">
          <SectionHeader number="06" title="Prompt Engineering Basics" subtitle="How to communicate effectively with AI systems" />

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="font-semibold mb-6">Why Prompts Matter</h3>
              <div className="space-y-4">
                {[
                  { icon: '🎯', title: 'Be Specific', text: 'Vague prompts get vague answers.' },
                  { icon: '📋', title: 'Provide Context', text: "AI doesn't know your situation." },
                  { icon: '🎭', title: 'Define the Role', text: 'Who should the AI be?' },
                  { icon: '📐', title: 'Specify Format', text: 'List? Table? JSON?' },
                ].map(item => (
                  <div key={item.title} className="p-4 rounded-xl" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}` }}>
                    <h4 className="font-semibold mb-1">{item.icon} {item.title}</h4>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {/* Bad Prompt */}
              <div className="rounded-2xl overflow-hidden" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}` }}>
                <div className="px-6 py-4 font-semibold" style={{ background: `rgba(239, 68, 68, 0.1)`, borderBottom: `1px solid ${colors.borderColor}`, color: colors.accentRed }}>
                  ❌ Bad Prompt
                </div>
                <div className="p-6">
                  <code className="block p-4 rounded-lg text-sm" style={{ background: '#0d1117', color: colors.textSecondary }}>
                    Tell me about AI agents.
                  </code>
                  <p className="text-sm mt-4" style={{ color: colors.accentRed }}>Too vague. What aspect? For whom?</p>
                </div>
              </div>

              {/* Good Prompt */}
              <div className="rounded-2xl overflow-hidden" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}` }}>
                <div className="px-6 py-4 font-semibold" style={{ background: `rgba(16, 185, 129, 0.1)`, borderBottom: `1px solid ${colors.borderColor}`, color: colors.accentGreen }}>
                  ✅ Good Prompt (using Markdown)
                </div>
                <div className="p-6">
                  <pre className="p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap" style={{ background: '#0d1117', color: colors.textSecondary }}>
{`# Role
You are an AI consultant explaining technology to a bank CEO.

## Task
Explain AI agents in **3 paragraphs**:

1. What they are *(no jargon)*
2. One concrete banking example
3. Key risk to be aware of

## Constraints
- Keep it under \`200 words\`
- The CEO has **2 minutes** to read`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Markdown Section */}
      <section
        ref={el => { sectionRefs.current['markdown'] = el; }}
        id="markdown"
        className="min-h-screen flex flex-col justify-center px-8 py-24"
      >
        <div className="max-w-[1200px] mx-auto w-full">
          <SectionHeader number="07" title="Markdown Basics" subtitle="The universal language for AI documentation" />

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="font-semibold mb-4">Why Markdown?</h3>
              <div className="space-y-3">
                {[
                  '✅ Plain text - works everywhere',
                  '✅ Easy to learn - 5 minutes',
                  '✅ Version control friendly',
                  '✅ AI models understand it natively',
                ].map(text => (
                  <div key={text} className="p-4 rounded-xl" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}` }}>
                    <h4 className="font-semibold">{text}</h4>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}` }}>
                <div className="px-4 py-3 text-xs font-semibold" style={{ background: `rgba(6, 182, 212, 0.1)`, borderBottom: `1px solid ${colors.borderColor}`, color: colors.accentCyan }}>
                  Markdown Syntax
                </div>
                <pre className="p-4 text-sm font-mono whitespace-pre-wrap" style={{ color: colors.textSecondary }}>
{`# Heading 1
## Heading 2

**Bold** and *Italic*

- Bullet point
- Another point

1. Numbered
2. List

\`inline code\``}
                </pre>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}` }}>
                <div className="px-4 py-3 text-xs font-semibold" style={{ background: `rgba(16, 185, 129, 0.1)`, borderBottom: `1px solid ${colors.borderColor}`, color: colors.accentGreen }}>
                  Rendered
                </div>
                <div className="p-4 text-sm">
                  <h1 className="text-2xl font-bold mb-2">Heading 1</h1>
                  <h2 className="text-xl font-semibold mb-2" style={{ color: colors.textSecondary }}>Heading 2</h2>
                  <p className="mb-2"><strong>Bold</strong> and <em>Italic</em></p>
                  <p className="mb-2">• Bullet point<br />• Another point</p>
                  <p><code className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#0d1117' }}>inline code</code></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section
        ref={el => { sectionRefs.current['tools'] = el; }}
        id="tools"
        className="min-h-screen flex flex-col justify-center px-8 py-24"
      >
        <div className="max-w-[1200px] mx-auto w-full">
          <SectionHeader number="08" title="Your AI Toolkit" subtitle="Three powerful tools for learning and building" />

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              {
                icon: '💬',
                title: 'ChatGPT Enterprise',
                desc: 'AI Tutors for learning, exploration, and getting unstuck.',
                features: ['Custom GPTs for each role', 'Enterprise security', 'Conversation history'],
                access: 'Already provisioned',
                color: colors.accentGreen,
              },
              {
                icon: '🌟',
                title: 'Google Gemini',
                desc: 'Via Google Partner Advantage Program. Unlimited context, multimodal.',
                features: ['Gemini 3.0 Pro access', 'API credits included', 'Long context window'],
                access: 'Requires Google ID setup ↓',
                color: colors.accentBlue,
              },
              {
                icon: '🚀',
                title: 'Google Antigravity',
                desc: 'AI-native IDE (VS Code alternative by Google). Our primary coding tool.',
                features: ['Gemini 3 Pro built-in', 'Agentic coding', 'Browser control for testing'],
                access: 'antigravity.google',
                color: colors.accentPurple,
              },
            ].map(tool => (
              <div key={tool.title} className="p-6 rounded-2xl" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}`, borderTop: `3px solid ${tool.color}` }}>
                <div className="text-3xl mb-4">{tool.icon}</div>
                <h3 className="font-semibold mb-2">{tool.title}</h3>
                <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>{tool.desc}</p>
                <ul className="text-sm space-y-1 mb-4" style={{ color: colors.textSecondary }}>
                  {tool.features.map(f => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                <p className="text-xs" style={{ color: tool.color }}>Access: {tool.access}</p>
              </div>
            ))}
          </div>

          {/* Google ID Setup */}
          <div className="p-6 rounded-2xl" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}`, borderLeft: `4px solid ${colors.accentBlue}` }}>
            <h3 className="font-semibold mb-4" style={{ color: colors.accentBlue }}>🔑 How to Get Your Google ID (@kyndryl.com)</h3>
            <p className="mb-6" style={{ color: colors.textSecondary }}>Required for Google Gemini and Antigravity access. Complete these steps BEFORE Day 2.</p>

            <div className="p-6 rounded-xl text-sm" style={{ background: '#0d1117' }}>
              <ol className="space-y-3" style={{ color: colors.textSecondary }}>
                <li>1. Go to <strong className="text-white">OKTA</strong>: <a href="https://kyndrylokta.at.okta.com/" target="_blank" rel="noopener noreferrer" style={{ color: colors.accentCyan }}>https://kyndrylokta.at.okta.com/</a></li>
                <li>2. Search for the application <code className="px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.1)' }}>GCP_KD</code></li>
                <li>3. Click <strong className="text-white">Request access</strong></li>
                <li>4. In the field &ldquo;Add or Remove access&rdquo;, select <strong style={{ color: colors.accentGreen }}>Add</strong></li>
                <li>5. For group, select: <code className="px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.1)' }}>GCP_KD-partner@kyndryl.com</code></li>
                <li>6. Add your business justification: <em style={{ color: colors.textMuted }}>&ldquo;AI Academy 2026 - need access to Google Partner tools for training&rdquo;</em></li>
                <li>7. Submit the request</li>
              </ol>
            </div>

            <div className="mt-6 p-4 rounded-lg" style={{ background: `rgba(245, 158, 11, 0.1)`, border: `1px solid ${colors.accentOrange}` }}>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                <strong style={{ color: colors.accentOrange }}>⚠️ Approval Process:</strong> Your manager will receive an approval request first, followed by the GCP Governance team. Allow <strong className="text-white">1-2 business days</strong> for both approvals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Exercises Section */}
      <section
        ref={el => { sectionRefs.current['exercises'] = el; }}
        id="exercises"
        className="min-h-screen flex flex-col justify-center px-8 py-24"
      >
        <div className="max-w-[1200px] mx-auto w-full">
          <SectionHeader number="09" title="Today's Exercises" subtitle="Learning by doing - the only way that works" />

          <div className="max-w-[600px] mx-auto space-y-8">
            {/* Exercise 1 */}
            <div className="p-8 rounded-2xl" style={{ background: `linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)`, border: `1px solid ${colors.accentGreen}` }}>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: colors.accentGreen, color: colors.bgDark }}>
                EXERCISE
              </span>
              <h3 className="text-xl font-semibold mb-4">AI Tutor Exploration (20 min)</h3>
              <p className="mb-6" style={{ color: colors.textSecondary }}>Experience learning with AI - the core method of this Academy.</p>

              <ol className="space-y-4">
                {[
                  'Open ChatGPT Enterprise or Google Gemini',
                  'Find "AI Academy - AI Tutor" (ChatGPT) or use Gemini directly',
                  'Paste the bank scenario context (provided by mentor)',
                  'Discuss for 15-20 minutes',
                  'Note down 3 key insights you discovered',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-4" style={{ color: colors.textSecondary }}>
                    <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm" style={{ background: colors.accentGreen, color: colors.bgDark }}>
                      {i + 1}
                    </span>
                    <span className="pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Assignment */}
            <div className="p-8 rounded-2xl" style={{ background: `linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)`, border: `1px solid ${colors.accentPurple}` }}>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: colors.accentPurple, color: 'white' }}>
                ASSIGNMENT
              </span>
              <h3 className="text-xl font-semibold mb-4">Create Your Own Agent</h3>
              <p className="mb-6" style={{ color: colors.textSecondary }}>Identify ONE process from your work that an agent could perform.</p>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold mb-4">Deliverable</h4>
                  <ol className="space-y-3">
                    {[
                      'System prompt (max 500 words)',
                      '3 input/output examples',
                      'What agent does NOT do',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-4" style={{ color: colors.textSecondary }}>
                        <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-xs" style={{ background: colors.accentPurple, color: 'white' }}>
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Success Criteria</h4>
                  <div className="p-4 rounded-lg" style={{ border: `1px dashed ${colors.borderColor}` }}>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      ✓ Single, clear purpose<br />
                      ✓ Clear boundaries<br />
                      ✓ Predictable output<br />
                      ✓ Value explainable in 30 seconds
                    </p>
                  </div>
                  <p className="mt-4 font-medium" style={{ color: colors.accentOrange }}>📅 Deadline: Tomorrow, 03 Feb 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Section */}
      <section
        ref={el => { sectionRefs.current['summary'] = el; }}
        id="summary"
        className="min-h-screen flex flex-col justify-center px-8 py-24"
      >
        <div className="max-w-[1200px] mx-auto w-full">
          <SectionHeader number="10" title="Key Messages" subtitle="What to remember from Day 1" />

          {/* Key Takeaways */}
          <div className="p-8 rounded-2xl mb-12" style={{ background: `linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)`, border: `1px solid ${colors.accentBlue}` }}>
            <h3 className="text-center font-semibold mb-6" style={{ color: colors.accentBlue }}>🎯 Today&apos;s Takeaways</h3>
            <ol className="max-w-[600px] mx-auto space-y-4">
              {[
                'AI in 2026 = Autonomously acting systems',
                'Your role shifts from operator to architect',
                "Without structure, there's no scaling",
                "KAF = Kyndryl's answer to enterprise AI",
                'The best way to learn = create',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-lg font-medium">
                  <span className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold" style={{ background: `linear-gradient(135deg, ${colors.accentBlue}, ${colors.accentPurple})` }}>
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </div>

          {/* Tomorrow & Self-Study */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="p-6 rounded-2xl" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}` }}>
              <h3 className="font-semibold mb-4">📅 Tomorrow: Day 2</h3>
              <h4 className="mb-2" style={{ color: colors.accentBlue }}>Prompt Engineering 2026</h4>
              <ul style={{ color: colors.textSecondary }}>
                <li>→ System prompts for autonomous agents</li>
                <li>→ Constitutional AI - giving agents &ldquo;character&rdquo;</li>
                <li>→ Chain-of-agents patterns</li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}` }}>
              <h3 className="font-semibold mb-4">📚 Self-Study Tonight</h3>
              <ul style={{ color: colors.textSecondary }}>
                <li>→ Complete required reading</li>
                <li>→ Complete your agent assignment</li>
                <li>→ Submit by 09:00 tomorrow</li>
              </ul>
            </div>
          </div>

          {/* Final Quote */}
          <div className="text-center p-12 rounded-2xl" style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}` }}>
            <p className="text-2xl italic mb-8" style={{ color: colors.textSecondary }}>
              &ldquo;The future belongs to those who create it.<br />Not those who read about it.&rdquo;
            </p>
            <button
              onClick={() => scrollToSection('exercises')}
              className="px-6 py-3 rounded-lg font-medium transition-all hover:-translate-y-0.5"
              style={{ background: `linear-gradient(135deg, ${colors.accentBlue}, ${colors.accentPurple})`, color: 'white' }}
            >
              Start Your Assignment →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-12" style={{ borderTop: `1px solid ${colors.borderColor}` }}>
        <p style={{ color: colors.textMuted }}>AI Academy 2026 • Kyndryl • Day 1: The New Reality</p>
        <p className="text-sm mt-2" style={{ color: colors.textMuted }}>February 2, 2026 • Brno, Czech Republic</p>
      </footer>

      {/* Scroll buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-2 z-50">
        <button
          onClick={scrollPrev}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:bg-blue-500"
          style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}`, color: colors.textPrimary }}
          title="Previous section"
        >
          ↑
        </button>
        <button
          onClick={scrollNext}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:bg-blue-500"
          style={{ background: colors.bgCard, border: `1px solid ${colors.borderColor}`, color: colors.textPrimary }}
          title="Next section"
        >
          ↓
        </button>
      </div>
    </div>
  );
}

// Section Header Component
function SectionHeader({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return (
    <div className="text-center mb-16">
      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ color: colors.accentBlue, background: `rgba(59, 130, 246, 0.1)` }}>
        {number}
      </span>
      <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
      <p className="text-lg max-w-[600px] mx-auto" style={{ color: colors.textSecondary }}>{subtitle}</p>
    </div>
  );
}
