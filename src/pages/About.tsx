import React from 'react';
import { Shield, Users, Zap, Globe, CheckCircle } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-20">
      <section className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter">The Future of <span className="text-primary">Remote Work</span></h1>
        <p className="text-xl text-text-muted max-w-2xl mx-auto font-medium">ApplyHub.me is not just a job board. It's a controlled marketplace designed to connect the best remote talent with verified opportunities.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight">Our Mission</h2>
          <p className="text-text-muted leading-relaxed">
            We believe that the current job market is broken. Over-saturated job boards and automated spam have made it impossible for real talent to stand out and for employers to find the right fit.
          </p>
          <p className="text-text-muted leading-relaxed">
            ApplyHub.me solves this by introducing a <strong className="text-text-dark dark:text-white">controlled application economy</strong>. By limiting the number of applications per user, we ensure that every application is intentional, high-quality, and actually read by the employer.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Feature icon={<Shield className="text-primary" />} title="Verified Employers" desc="Every employer is manually verified to prevent scams." />
          <Feature icon={<Users className="text-emerald-600" />} title="Quality Over Quantity" desc="Limited applications mean less noise for everyone." />
          <Feature icon={<Zap className="text-accent" />} title="Instant Activation" desc="Fast verification for payments and job postings." />
          <Feature icon={<Globe className="text-purple-600" />} title="Global Reach" desc="Connect with remote opportunities from around the world." />
        </div>
      </div>

      <section className="bg-primary rounded-[3rem] p-12 text-white text-center space-y-8 shadow-2xl shadow-primary/20">
        <h2 className="text-3xl font-black tracking-tight">Why Choose ApplyHub.me?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="text-5xl font-black">95%</div>
            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest">Application Read Rate</p>
          </div>
          <div className="space-y-2">
            <div className="text-5xl font-black">1000+</div>
            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest">Verified Remote Jobs</p>
          </div>
          <div className="space-y-2">
            <div className="text-5xl font-black">24h</div>
            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest">Average Response Time</p>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-extrabold text-center tracking-tight">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <FaqItem q="How does the application limit work?" a="Free users can apply to 1 job every 7 days. This ensures that you only apply to jobs you are truly qualified for and interested in. You can upgrade to increase this limit." />
          <FaqItem q="Is my data safe?" a="Yes. We use industry-standard encryption and never share your personal information with third parties without your consent." />
          <FaqItem q="How do I post a job?" a="Register as a Client, purchase job credits, and fill out the job posting form. Our admin will verify your posting within 1-2 hours." />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, desc }: any) {
  return (
    <div className="flex items-start p-6 bg-white dark:bg-sidebar rounded-2xl shadow-card border border-border dark:border-gray-700">
      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl mr-4">{icon}</div>
      <div>
        <h4 className="font-bold mb-1">{title}</h4>
        <p className="text-sm text-text-muted font-medium">{desc}</p>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: any) {
  return (
    <div className="p-6 bg-white dark:bg-sidebar rounded-2xl border border-border dark:border-gray-700 shadow-sm">
      <h4 className="font-bold mb-2 flex items-center text-text-dark dark:text-white">
        <CheckCircle className="w-5 h-5 text-primary mr-2" />
        {q}
      </h4>
      <p className="text-text-muted text-sm ml-7 font-medium">{a}</p>
    </div>
  );
}
