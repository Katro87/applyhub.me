import React, { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { PhoneAuthProvider, RecaptchaVerifier, sendEmailVerification, updatePhoneNumber } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';
import { Mail, Phone, Briefcase, Award, MapPin, Save, Edit2, BadgeCheck, ShieldAlert } from 'lucide-react';

export default function Profile({ user, profile }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>(profile || {});
  const [sendingEmailVerification, setSendingEmailVerification] = useState(false);
  const [smsVerificationId, setSmsVerificationId] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser || typeof window === 'undefined') return;
    const recaptchaKey = 'applyhubRecaptcha';
    const win = window as any;

    if (!win[recaptchaKey]) {
      win[recaptchaKey] = new RecaptchaVerifier(auth, 'profile-recaptcha', {
        size: 'invisible'
      });
      void win[recaptchaKey].render();
    }
  }, [currentUser]);

  if (!profile) return <div className="py-20 text-center">Please login to view your profile.</div>;

  const displayName = (profile.fullName || 'User').trim() || 'User';

  const handleSave = async () => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, formData);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailVerification = async () => {
    if (!currentUser) return;
    setSendingEmailVerification(true);
    try {
      await sendEmailVerification(currentUser);
      alert('Verification email sent. Please check your inbox.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'auth/emailVerification');
    } finally {
      setSendingEmailVerification(false);
    }
  };

  const handleSendSmsCode = async () => {
    if (!currentUser) return;
    if (!formData.phone) {
      setSmsMessage('Add a phone number first, then save profile.');
      return;
    }

    setSmsLoading(true);
    setSmsMessage('');

    try {
      const win = window as any;
      const appVerifier = win.applyhubRecaptcha;
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(formData.phone, appVerifier);
      setSmsVerificationId(verificationId);
      setSmsMessage('Verification code sent via SMS.');
    } catch (err: any) {
      setSmsMessage(err.message || 'Unable to send SMS verification code. Ensure Phone auth is enabled in Firebase.');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleVerifySmsCode = async () => {
    if (!currentUser || !smsVerificationId || !smsCode) return;
    setSmsLoading(true);
    setSmsMessage('');

    try {
      const credential = PhoneAuthProvider.credential(smsVerificationId, smsCode);
      await updatePhoneNumber(currentUser, credential);
      await updateDoc(doc(db, 'users', profile.uid), {
        phone: formData.phone,
        phoneVerified: true
      });
      setSmsMessage('Phone number verified successfully.');
      setSmsCode('');
      setSmsVerificationId('');
    } catch (err: any) {
      setSmsMessage(err.message || 'Invalid code or verification failed.');
    } finally {
      setSmsLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-bg dark:bg-gray-900 rounded-3xl p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-sidebar rounded-3xl shadow-card border border-border dark:border-gray-700 overflow-hidden">
        <div className="h-24 sm:h-28 bg-primary"></div>
        <div className="px-6 sm:px-8 pb-6 sm:pb-8">
          <div className="relative -mt-10 sm:-mt-12 mb-5 sm:mb-6 flex justify-between items-end gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-sidebar rounded-2xl p-1 shadow-lg">
              <div className="w-full h-full bg-primary-light dark:bg-gray-700 rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-primary">
                {displayName[0]}
              </div>
            </div>
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading}
              className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center shadow-lg"
            >
              {isEditing ? <><Save className="w-4 h-4 mr-2" /> Save Profile</> : <><Edit2 className="w-4 h-4 mr-2" /> Edit Profile</>}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <section className="space-y-3.5">
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="text-2xl sm:text-3xl font-extrabold bg-white text-text-dark border border-border rounded-xl px-4 py-2 w-full outline-none focus:ring-2 focus:ring-primary dark:bg-gray-900 dark:text-white dark:border-gray-700"
                  />
                ) : (
                  <h1 className="text-2xl sm:text-3xl font-extrabold">{displayName}</h1>
                )}
                
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.title}
                    placeholder="Your Professional Title (e.g. Frontend Developer)"
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="text-base sm:text-lg text-primary bg-white border border-border rounded-xl px-4 py-2 w-full outline-none focus:ring-2 focus:ring-primary dark:bg-gray-900 dark:border-gray-700"
                  />
                ) : (
                  <p className="text-base sm:text-lg text-primary font-bold">{profile.title || 'No title set'}</p>
                )}

                <div className="flex flex-wrap gap-3 text-sm text-text-muted">
                  <span className="flex items-center"><Mail className="w-4 h-4 mr-1" /> {profile.email}</span>
                  <span className="flex items-center"><Phone className="w-4 h-4 mr-1" /> {profile.phone || 'No phone'}</span>
                  <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> Remote</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className={`flex items-center gap-2 text-[11px] sm:text-xs font-bold px-3 py-2 rounded-xl border ${currentUser?.emailVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {currentUser?.emailVerified ? <BadgeCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    Email {currentUser?.emailVerified ? 'verified' : 'not verified'}
                  </div>
                  <div className={`flex items-center gap-2 text-[11px] sm:text-xs font-bold px-3 py-2 rounded-xl border ${(profile as any).phoneVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {(profile as any).phoneVerified ? <BadgeCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    Phone {(profile as any).phoneVerified ? 'verified' : 'not verified'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {!currentUser?.emailVerified && (
                    <button
                      type="button"
                      onClick={handleSendEmailVerification}
                      disabled={sendingEmailVerification}
                      className="px-4 py-2 rounded-xl border border-primary/20 bg-primary-light text-primary text-xs sm:text-sm font-bold hover:bg-blue-100 disabled:opacity-50"
                    >
                      {sendingEmailVerification ? 'Sending email...' : 'Verify email'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSendSmsCode}
                    disabled={smsLoading}
                    className="px-4 py-2 rounded-xl border border-primary/20 bg-primary-light text-primary text-xs sm:text-sm font-bold hover:bg-blue-100 disabled:opacity-50"
                  >
                    {smsLoading ? 'Sending code...' : 'Send SMS code'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                  <input
                    type="text"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    placeholder="Enter SMS code"
                    className="w-full px-4 py-2 bg-white border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary text-xs sm:text-sm dark:bg-gray-900 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={handleVerifySmsCode}
                    disabled={smsLoading || !smsVerificationId || !smsCode}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                  >
                    Verify SMS
                  </button>
                </div>

                {smsMessage && <p className="text-xs font-medium text-text-muted">{smsMessage}</p>}
                <div id="profile-recaptcha" />
              </section>

              <section className="space-y-3.5">
                <h3 className="text-lg font-bold">About Me</h3>
                {isEditing ? (
                  <textarea 
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="w-full p-4 bg-white text-text-dark border border-border rounded-xl min-h-32 outline-none focus:ring-2 focus:ring-primary dark:bg-gray-900 dark:text-white dark:border-gray-700"
                    placeholder="Tell us about your background and goals..."
                  />
                ) : (
                  <p className="text-text-dark dark:text-gray-300 leading-relaxed">
                    {profile.bio || 'Tell the world about yourself! Edit your profile to add a bio.'}
                  </p>
                )}
              </section>

              <section className="space-y-3.5">
                <h3 className="text-lg font-bold">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.map((skill: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      {skill}
                    </span>
                  ))}
                  {(!profile.skills || profile.skills.length === 0) && <p className="text-text-muted text-sm italic">No skills added yet.</p>}
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <div className="bg-white dark:bg-sidebar p-5 rounded-2xl border border-border dark:border-gray-700 space-y-5">
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider text-text-muted font-bold mb-3.5 flex items-center"><Award className="w-4 h-4 mr-2 text-accent" /> Subscription</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Plan</span>
                      <span className="font-bold capitalize">{profile.subscriptionTier}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Applications</span>
                      <span className="font-bold">{profile.applicationsThisWeek} / {profile.applicationLimit}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] uppercase tracking-wider text-text-muted font-bold mb-3.5 flex items-center"><Briefcase className="w-4 h-4 mr-2 text-primary" /> Work Info</h4>
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Experience</label>
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={formData.experienceYears}
                          onChange={(e) => setFormData({...formData, experienceYears: Number(e.target.value)})}
                          className="w-full bg-white border border-border rounded-lg px-3 py-1 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700"
                        />
                      ) : (
                        <p className="text-xs sm:text-sm font-bold">{profile.experienceYears || 0} Years</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Hourly Rate</label>
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={formData.hourlyRate}
                          onChange={(e) => setFormData({...formData, hourlyRate: Number(e.target.value)})}
                          className="w-full bg-white border border-border rounded-lg px-3 py-1 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700"
                        />
                      ) : (
                        <p className="text-xs sm:text-sm font-bold">${profile.hourlyRate || 0}/hr</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
