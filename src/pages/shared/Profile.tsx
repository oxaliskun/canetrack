import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Save, ShieldCheck, Phone, MapPin, Loader2, Camera, Trash2, Building2, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axiosInstance';
import { resolveProfilePic } from '../../lib/utils';
import { toast } from 'sonner';

export function Profile() {
  const { user: authUser, login } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [paNumber, setPaNumber] = useState('');
  const [millName, setMillName] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('UNVERIFIED');
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [verifyMillName, setVerifyMillName] = useState('');
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [validId, setValidId] = useState<File | null>(null);
  const [validIdPreview, setValidIdPreview] = useState('');
  const [landDocument, setLandDocument] = useState<File | null>(null);
  const [landDocumentPreview, setLandDocumentPreview] = useState('');
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState('');

  const mindanaoMills = [
    'Busco Sugar Milling Co., Inc. (BUSCO)',
    'Crystal Sugar Milling Co., Inc. (CSM)',
    'Cotabato Sugar Central Co., Inc.',
    'Davao Sugar Central',
    'Bukidnon Sugar Milling Co., Inc. (BUSMICO)',
    'Greenfield Sugar Corporation',
    'Philippine Sugar Milling Corporation (PSMC)',
    'Talisay Sugar Milling Co., Inc.',
    'Southern Sugar Milling Co., Inc.',
    'Agusan Sugar Milling Corporation',
  ];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const validIdRef = useRef<HTMLInputElement>(null);
  const landDocRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        const u = res.data.user;
        setName(u.name || '');
        setContactNumber(u.contactNumber || '');
        setAddress(u.address || '');
        setProfilePicture(u.profilePicture || '');
        setPaNumber(u.paNumber || '');
        setMillName(u.millName || '');
        setVerifyMillName(u.millName || '');
        setVerificationStatus(u.verificationStatus || 'UNVERIFIED');
        if (u.farms && u.farms.length > 0) {
          setFarmName(u.farms[0].farmName || '');
          setFarmLocation(u.farms[0].location || '');
        }
      } catch {
        setName(authUser?.name || '');
        setContactNumber(authUser?.contactNumber || '');
        setAddress(authUser?.address || '');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfilePicture(res.data.url);
      toast.success('Photo uploaded');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    }
  };

  const handleRemovePhoto = () => {
    setProfilePicture('');
  };

  const handleVerifySubmit = async () => {
    if (!validId || !selfie) {
      toast.error('Please upload your Valid ID and Selfie');
      return;
    }
    setVerifying(true);
    try {
      const formData = new FormData();
      formData.append('validId', validId);
      if (landDocument) formData.append('landDocument', landDocument);
      formData.append('selfie', selfie);
      if (verifyMillName) formData.append('millName', verifyMillName);

      const res = await api.patch('/users/verify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setVerificationStatus('VERIFIED');
      setMillName(verifyMillName);
      if (res.data.user) {
        const updatedUser = { ...authUser, ...res.data.user, verificationStatus: 'VERIFIED', millName: verifyMillName };
        localStorage.setItem('canetrack_user', JSON.stringify(updatedUser));
        login(localStorage.getItem('canetrack_token') || '', updatedUser);
      }
      toast.success('Account verified successfully! All features are now available.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload: any = { name: name.trim(), contactNumber, address, profilePicture, paNumber: paNumber || undefined, millName: millName || undefined };
      await api.patch('/users/profile', payload);
      // Update local user state
      if (authUser) {
        const updatedUser = {
          ...authUser,
          name: name.trim(),
          contactNumber,
          address,
          profilePicture,
          paNumber,
          millName,
          verificationStatus,
        };
        localStorage.setItem('canetrack_user', JSON.stringify(updatedUser));
      }
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.old) {
      toast.error('Current password is required');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.new.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await api.patch(`/users/${authUser!.userId}/password`, { oldPassword: passwords.old, password: passwords.new });
      toast.success('Password updated successfully');
      setPasswords({ old: '', new: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-emerald-500/30 border-t-emerald-400' : 'border-emerald-500/30 border-t-emerald-500'}`} />
    </div>
  );

  const inputClass = `w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900'}`;
  const labelClass = `block text-[11px] sm:text-xs font-extrabold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`;

  return (
    <div className="space-y-8 max-w-4xl mx-auto relative">
      <div className={`absolute top-0 right-0 w-[25%] h-[25%] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-emerald-950/30' : 'bg-emerald-50/50'}`} />

      <div className="flex flex-col mb-4 relative">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 sm:mb-3 border w-max ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300'}`}>
          <User className="w-3.5 h-3.5" /> Identity
        </div>
        <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>My Profile</h1>
        <p className={`mt-1 text-sm sm:text-base font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Manage your personal information and account settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Profile Information Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl sm:rounded-[2rem] border shadow-xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`p-4 sm:p-6 lg:p-8 border-b ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="flex flex-col items-center sm:items-start">
                  <div className="relative group">
                    <div onClick={handleProfilePictureClick} className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-black border-4 shadow-sm cursor-pointer overflow-hidden ${isDark ? 'bg-emerald-900/50 text-emerald-400 border-slate-700' : 'bg-emerald-100 text-emerald-600 border-white'}`}>
                      {profilePicture ? (
                        <img src={resolveProfilePic(profilePicture)} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        authUser?.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div onClick={handleProfilePictureClick} className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button type="button" onClick={handleProfilePictureClick} className={`text-[11px] font-bold flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all min-h-[32px] ${isDark ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}>
                      <Camera className="w-3.5 h-3.5" /> Change
                    </button>
                    {profilePicture && (
                      <button type="button" onClick={handleRemovePhoto} className={`text-[11px] font-bold flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all min-h-[32px] ${isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-center sm:text-left min-w-0">
                  <h2 className={`text-xl sm:text-2xl font-extrabold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{authUser?.name}</h2>
                  <p className={`font-mono text-xs sm:text-sm truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{authUser?.email}</p>
                  <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-widest ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                    <ShieldCheck className="w-3 h-3" /> Farmer
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              <h3 className={`text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}><User className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} /> Personal Information</h3>

              <form onSubmit={handleSaveProfile} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Juan Dela Cruz" />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" disabled value={authUser?.email || ''} className={`${inputClass} opacity-60 cursor-not-allowed`} />
                  </div>
                  <div>
                    <label className={labelClass}>Contact Number</label>
                    <div className="relative">
                      <input type="tel" value={contactNumber} onChange={e => setContactNumber(e.target.value)} className={`${inputClass} pl-9 sm:pl-10`} placeholder="+63 912 345 6789" />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>P.A. No.</label>
                    <div className="relative">
                      <input type="text" value={paNumber} readOnly className={`${inputClass} pl-9 sm:pl-10 opacity-70 cursor-not-allowed`} placeholder="Auto-generated upon verification" />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold"><span className={isDark ? 'text-slate-500' : 'text-slate-400'}>#</span></span>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Mill Name</label>
                    <div className="relative">
                      <input type="text" value={millName} onChange={e => setMillName(e.target.value)} className={`${inputClass} pl-9 sm:pl-10`} placeholder="e.g. BUSCO SUGAR MILLING CO., INC." />
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Complete Address</label>
                  <div className="relative">
                    <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} className={`${inputClass} pl-9 sm:pl-10 resize-none`} placeholder="123 Barangay San Juan, Province" />
                    <MapPin className="absolute left-3 top-4 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                  {verificationStatus === 'UNVERIFIED' && (
                    <div className={`p-4 sm:p-5 rounded-xl border-2 ${isDark ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200'}`}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`w-6 h-6 shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                        <div className="min-w-0">
                          <h4 className={`text-sm sm:text-base font-extrabold ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>Verify your account to unlock all features</h4>
                          <p className={`text-xs sm:text-sm mt-1 font-medium ${isDark ? 'text-amber-300/70' : 'text-amber-700/70'}`}>Upload your valid ID and a selfie holding it. Your account will be verified immediately.</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-4">
                        <div>
                          <label className={`${labelClass} ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Valid ID <span className="text-red-500">*</span></label>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => validIdRef.current?.click()} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'}`}>
                              <Upload className="w-4 h-4" /> {validId ? 'Change' : 'Upload ID'}
                            </button>
                            {validId && <span className={`text-xs font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{validId.name}</span>}
                          </div>
                          <input type="file" ref={validIdRef} accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setValidId(f); setValidIdPreview(URL.createObjectURL(f)); } }} />
                          {validIdPreview && (
                            <div className="mt-2 relative inline-block">
                              <img src={validIdPreview} alt="Valid ID preview" className="h-28 rounded-lg object-cover border border-slate-200" />
                              <button type="button" onClick={() => { setValidId(null); setValidIdPreview(''); }} className={`absolute top-1 right-1 p-1 rounded-full ${isDark ? 'bg-slate-900/80 text-slate-300 hover:bg-slate-900' : 'bg-white/80 text-slate-600 hover:bg-white'}`}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className={`${labelClass} ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Land Title / Land Document</label>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => landDocRef.current?.click()} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'}`}>
                              <Upload className="w-4 h-4" /> {landDocument ? 'Change' : 'Upload Land Title'}
                            </button>
                            {landDocument && <span className={`text-xs font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{landDocument.name}</span>}
                          </div>
                          <input type="file" ref={landDocRef} accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setLandDocument(f); setLandDocumentPreview(URL.createObjectURL(f)); } }} />
                          {landDocumentPreview && (
                            <div className="mt-2 relative inline-block">
                              <img src={landDocumentPreview} alt="Land document preview" className="h-28 rounded-lg object-cover border border-slate-200" />
                              <button type="button" onClick={() => { setLandDocument(null); setLandDocumentPreview(''); }} className={`absolute top-1 right-1 p-1 rounded-full ${isDark ? 'bg-slate-900/80 text-slate-300 hover:bg-slate-900' : 'bg-white/80 text-slate-600 hover:bg-white'}`}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className={`${labelClass} ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Selfie Holding ID <span className="text-red-500">*</span></label>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => selfieRef.current?.click()} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'}`}>
                              <Camera className="w-4 h-4" /> {selfie ? 'Change' : 'Upload Selfie'}
                            </button>
                            {selfie && <span className={`text-xs font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selfie.name}</span>}
                          </div>
                          <input type="file" ref={selfieRef} accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setSelfie(f); setSelfiePreview(URL.createObjectURL(f)); } }} />
                          {selfiePreview && (
                            <div className="mt-2 relative inline-block">
                              <img src={selfiePreview} alt="Selfie preview" className="h-28 rounded-lg object-cover border border-slate-200" />
                              <button type="button" onClick={() => { setSelfie(null); setSelfiePreview(''); }} className={`absolute top-1 right-1 p-1 rounded-full ${isDark ? 'bg-slate-900/80 text-slate-300 hover:bg-slate-900' : 'bg-white/80 text-slate-600 hover:bg-white'}`}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className={`${labelClass} ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Mill Company <span className="text-red-500">*</span></label>
                          <select
                            value={verifyMillName}
                            onChange={e => setVerifyMillName(e.target.value)}
                            className={`${inputClass} appearance-none ${!verifyMillName ? 'text-slate-400' : ''}`}
                          >
                            <option value="" disabled>Select your mill company</option>
                            {mindanaoMills.map(mill => (
                              <option key={mill} value={mill}>{mill}</option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={handleVerifySubmit}
                          disabled={verifying || !validId || !selfie || !verifyMillName}
                          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 min-h-[44px] w-full justify-center ${isDark ? 'bg-amber-600 text-white hover:bg-amber-500 shadow-amber-600/20' : 'bg-amber-600 text-white hover:bg-amber-500 shadow-amber-600/20'}`}
                        >
                          {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Submit for Verification
                        </button>
                      </div>
                    </div>
                  )}

                  {verificationStatus === 'VERIFIED' && (
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                      <CheckCircle className="w-4 h-4" /> Verified
                    </div>
                  )}

                <div className="flex justify-end pt-3 sm:pt-4">
                  <button type="submit" disabled={saving} className={`flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 min-h-[44px] ${isDark ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'}`}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                  </button>
                </div>
              </form>
            </div>
          </motion.div>

          {/* Security Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`rounded-xl sm:rounded-[2rem] border shadow-xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="p-4 sm:p-6 lg:p-8">
              <h3 className={`text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}><Lock className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} /> Security Settings</h3>

              <form onSubmit={handleUpdatePassword} className="space-y-4 sm:space-y-6">
                <div>
                  <label className={labelClass}>Current Password</label>
                  <input type="password" required value={passwords.old} onChange={e => setPasswords({ ...passwords, old: e.target.value })} className={inputClass} placeholder="Enter current password" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className={labelClass}>New Password</label>
                    <input type="password" required value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} className={inputClass} placeholder="Min. 6 characters" minLength={6} />
                  </div>
                  <div>
                    <label className={labelClass}>Confirm New Password</label>
                    <input type="password" required value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} className={inputClass} placeholder="Re-enter password" />
                  </div>
                </div>

                <div className="flex justify-end pt-3 sm:pt-4">
                  <button type="submit" className={`flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl font-bold shadow-lg transition-all min-h-[44px] ${isDark ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'}`}>
                    <Save className="w-4 h-4" /> Update Password
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Sidebar - Profile Overview */}
        <div className="md:col-span-1">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`rounded-xl sm:rounded-[2rem] border shadow-xl overflow-hidden h-full flex flex-col ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`p-4 sm:p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className={`font-extrabold tracking-tight text-base sm:text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Profile Summary</h3>
            </div>
            <div className={`p-4 sm:p-6 flex-1 space-y-4 sm:space-y-5 ${isDark ? 'bg-slate-800/30' : 'bg-slate-50/50'}`}>
              <div>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Full Name</p>
                <p className={`font-bold mt-1 text-sm sm:text-base truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{name || authUser?.name}</p>
              </div>
              <div>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Email</p>
                <p className={`font-mono text-xs sm:text-sm mt-1 truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{authUser?.email}</p>
              </div>
              <div>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Contact</p>
                <p className={`font-medium mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{contactNumber || '—'}</p>
              </div>
              <div>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Address</p>
                <p className={`font-medium mt-1 text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{address || '—'}</p>
              </div>
              <div>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Role</p>
                <div className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-widest ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                  <ShieldCheck className="w-3 h-3" /> Farmer
                </div>
              </div>
              <div className={`pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Verification</p>
                <div className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-widest ${verificationStatus === 'VERIFIED' ? (isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : (isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700')}`}>
                  {verificationStatus === 'VERIFIED' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />} {verificationStatus === 'VERIFIED' ? 'Verified' : 'Unverified'}
                </div>
              </div>
              <div>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>P.A. No.</p>
                <p className={`font-mono font-bold mt-1 text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{paNumber || '—'}</p>
              </div>
              <div>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Mill Name</p>
                <p className={`font-bold mt-1 text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{millName || '—'}</p>
              </div>
              <div className={`pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Farm Name</p>
                <p className={`font-bold mt-1 text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{farmName || '—'}</p>
              </div>
              <div>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Farm Location</p>
                <p className={`font-medium mt-1 text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{farmLocation || '—'}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}