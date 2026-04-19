import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setNotice('Password reset email sent. Please check your inbox.');
    } catch {
      setError('Unable to send reset email. Please verify the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white dark:bg-sidebar p-8 rounded-3xl shadow-card border border-border dark:border-gray-700 space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold">Reset Password</h1>
          <p className="text-sm text-text-muted mt-1">Enter your email to receive a password reset link.</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-3 rounded-xl text-xs border border-red-100 dark:border-red-900/50 font-bold">
            {error}
          </div>
        )}

        {notice && (
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs border border-emerald-200 font-bold">
            {notice}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white text-text-dark placeholder:text-slate-400 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none shadow-sm dark:bg-gray-900 dark:text-white dark:border-gray-700"
            placeholder="name@example.com"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>

        <Link to="/login" className="block text-center text-sm text-primary font-bold hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
