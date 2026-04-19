import React, { useState } from 'react';
import { Check, ArrowRight, Shield, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function Pricing({ user, profile }: any) {
  const [region, setRegion] = useState('PK');
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<any>(null);
  const navigate = useNavigate();

  const pricing = {
    PK: {
      trial: { price: '299 PKR', base: 299, currency: 'PKR' },
      monthly: { price: '969 PKR', base: 969, currency: 'PKR' },
      job: { price: '1,400 PKR', base: 1400, currency: 'PKR' }
    },
    US: {
      trial: { price: '$1.05', base: 1.05, currency: 'USD' },
      monthly: { price: '$3.50', base: 3.50, currency: 'USD' },
      job: { price: '$5.00', base: 5.00, currency: 'USD' }
    },
    UK: {
      trial: { price: '£0.85', base: 0.85, currency: 'GBP' },
      monthly: { price: '£2.80', base: 2.80, currency: 'GBP' },
      job: { price: '£4.00', base: 4.00, currency: 'GBP' }
    },
    UAE: {
      trial: { price: '3.85 AED', base: 3.85, currency: 'AED' },
      monthly: { price: '12 AED', base: 12, currency: 'AED' },
      job: { price: '18 AED', base: 18, currency: 'AED' }
    }
  };

  const current = pricing[region as keyof typeof pricing];

  const handleSelect = (plan: any) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setShowPaymentModal(plan);
  };

  const submitPayment = async (method: string) => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'payments'), {
        userUid: user.uid,
        amount: showPaymentModal.base,
        currency: showPaymentModal.currency,
        method,
        status: 'Pending',
        type: showPaymentModal.type,
        planId: showPaymentModal.id,
        timestamp: serverTimestamp()
      });
      alert('Payment request submitted! Admin will verify your payment soon.');
      setShowPaymentModal(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'payments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Simple, Transparent <span className="text-primary">Pricing</span></h1>
        <p className="text-text-muted max-w-2xl mx-auto">Choose the plan that fits your career goals. Controlled applications ensure higher quality for everyone.</p>
        
        <div className="flex justify-center items-center space-x-4 mt-8">
          <Globe className="w-5 h-5 text-text-muted" />
          <select 
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-white dark:bg-sidebar border border-border dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary shadow-sm"
          >
            <option value="PK">Pakistan (PKR)</option>
            <option value="US">USA (USD)</option>
            <option value="UK">UK (GBP)</option>
            <option value="UAE">UAE (AED)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Free Plan */}
        <div className="bg-white dark:bg-sidebar p-8 rounded-3xl shadow-card border border-border dark:border-gray-700 flex flex-col">
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">Free Plan</h3>
            <p className="text-text-muted text-sm">For casual job seekers</p>
            <div className="mt-4 text-4xl font-extrabold">Free</div>
          </div>
          <ul className="space-y-4 mb-8 flex-grow">
            <li className="flex items-center text-sm"><Check className="w-5 h-5 text-emerald-500 mr-2" /> 1 Application / Week</li>
            <li className="flex items-center text-sm"><Check className="w-5 h-5 text-emerald-500 mr-2" /> Basic Profile</li>
            <li className="flex items-center text-sm"><Check className="w-5 h-5 text-emerald-500 mr-2" /> Job Browsing</li>
          </ul>
          <button className="w-full py-4 border border-border dark:border-gray-700 rounded-2xl font-bold text-text-muted cursor-not-allowed">Current Plan</button>
        </div>

        {/* Trial Plan */}
        <motion.div 
          whileHover={{ y: -8 }}
          className="bg-white dark:bg-sidebar p-8 rounded-3xl shadow-card border-2 border-primary relative flex flex-col"
        >
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Most Popular</div>
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">Trial Plan</h3>
            <p className="text-text-muted text-sm">14 days of full access</p>
            <div className="mt-4 text-4xl font-extrabold">{current.trial.price}</div>
          </div>
          <ul className="space-y-4 mb-8 flex-grow">
            <li className="flex items-center text-sm"><Check className="w-5 h-5 text-emerald-500 mr-2" /> 5 Applications / Week</li>
            <li className="flex items-center text-sm"><Check className="w-5 h-5 text-emerald-500 mr-2" /> Priority Visibility</li>
            <li className="flex items-center text-sm"><Check className="w-5 h-5 text-emerald-500 mr-2" /> Saved Jobs Enabled</li>
            <li className="flex items-center text-sm"><Check className="w-5 h-5 text-emerald-500 mr-2" /> 14 Days Duration</li>
          </ul>
          <button 
            onClick={() => handleSelect({ ...current.trial, id: 'trial', type: 'subscription' })}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
          >
            Get Trial
          </button>
        </motion.div>

        {/* Monthly Plan */}
        <motion.div 
          whileHover={{ y: -8 }}
          className="bg-white dark:bg-sidebar p-8 rounded-3xl shadow-card border border-border dark:border-gray-700 flex flex-col"
        >
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">Monthly Plan</h3>
            <p className="text-text-muted text-sm">For serious career growth</p>
            <div className="mt-4 text-4xl font-extrabold">{current.monthly.price}<span className="text-sm text-text-muted font-normal">/mo</span></div>
          </div>
          <ul className="space-y-4 mb-8 flex-grow">
            <li className="flex items-center text-sm"><Check className="w-5 h-5 text-emerald-500 mr-2" /> 50 Applications / Month</li>
            <li className="flex items-center text-sm"><Check className="w-5 h-5 text-emerald-500 mr-2" /> Top Priority Visibility</li>
            <li className="flex items-center text-sm"><Check className="w-5 h-5 text-emerald-500 mr-2" /> Full Profile Customization</li>
            <li className="flex items-center text-sm"><Check className="w-5 h-5 text-emerald-500 mr-2" /> 24/7 Support</li>
          </ul>
          <button 
            onClick={() => handleSelect({ ...current.monthly, id: 'monthly', type: 'subscription' })}
            className="w-full py-4 bg-text-dark text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors shadow-lg"
          >
            Go Monthly
          </button>
        </motion.div>
      </div>

      <div className="bg-primary-light dark:bg-blue-900/20 p-12 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-lg">
          <h2 className="text-3xl font-extrabold">Are you an Employer?</h2>
          <p className="text-text-dark dark:text-gray-300">Post your jobs and find the best remote talent. Our manual verification system ensures high-quality applicants.</p>
          <div className="flex items-center space-x-4 text-primary font-bold">
            <Shield className="w-6 h-6" />
            <span>Verified Hiring Program</span>
          </div>
        </div>
        <div className="bg-white dark:bg-sidebar p-8 rounded-3xl shadow-card border border-border dark:border-gray-700 w-full md:w-80 text-center">
          <h3 className="text-xl font-bold mb-2">Job Posting</h3>
          <div className="text-4xl font-extrabold mb-6">{current.job.price}</div>
          <p className="text-sm text-text-muted mb-8">Includes 2 job postings with 30-day visibility.</p>
          <button 
            onClick={() => handleSelect({ ...current.job, id: 'job_post', type: 'job_credits' })}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
          >
            Buy Credits
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPaymentModal(null)} />
          <div className="relative bg-white dark:bg-sidebar w-full max-w-md rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-extrabold mb-4">Complete Payment</h2>
            <p className="text-text-muted mb-6">To activate your <strong>{showPaymentModal.id}</strong> plan, please send <strong>{showPaymentModal.price}</strong> to one of the following methods:</p>
            
            <div className="space-y-4 mb-8">
              {region === 'PK' ? (
                <>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-border dark:border-gray-700">
                    <p className="font-bold">Easypaisa / JazzCash</p>
                    <p className="text-sm text-primary font-bold">0312-3456789</p>
                    <p className="text-[10px] text-text-muted mt-1 uppercase font-bold">Name: ApplyHub Admin</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-border dark:border-gray-700">
                    <p className="font-bold">Bank Transfer (HBL)</p>
                    <p className="text-sm text-primary font-bold">1234-5678-9012-3456</p>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-border dark:border-gray-700">
                  <p className="font-bold">Crypto (USDT BEP20)</p>
                  <p className="text-[11px] text-primary font-bold break-all">0x1234567890abcdef1234567890abcdef12345678</p>
                </div>
              )}
            </div>

            <div className="bg-accent/10 p-4 rounded-xl border border-accent/20 mb-8">
              <p className="text-[11px] text-accent font-bold">
                INSTANT ACTIVATION AFTER VERIFICATION. Please submit your request after sending the payment. Our admin will verify it within 1-2 hours.
              </p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowPaymentModal(null)}
                className="flex-grow py-3 border border-border dark:border-gray-700 rounded-xl font-bold text-text-muted"
              >
                Cancel
              </button>
              <button 
                onClick={() => submitPayment(region === 'PK' ? 'Easypaisa' : 'Crypto')}
                disabled={loading}
                className="flex-grow py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Submitting...' : 'I Have Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
