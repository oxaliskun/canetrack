import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Save, ShieldCheck, Phone, MapPin, Sprout, Loader2, Camera, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axiosInstance';
import { toast } from 'sonner';

export function Profile() {
  const { user: authUser } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFarmer = authUser?.role === 'FARMER';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        const u = res.data.user;
        setName(u.name || '');
        setContactNumber(u.contactNumber || '');
        setAddress(u.address || '');
        setProfilePicture(u.profilePicture || '');
        if (isFarmer && u.farms && u.farms.length > 0) {
          setFarmName(u.farms[0].farmName || '');
          setFarmLocation(u.farms[0].location || '');
        }
      } catch {
        // Fallback to auth user data
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload: any = { name: name.trim(), contactNumber, address, profilePicture };
      if (isFarmer) {
        payload.farmName = farmName.trim();
        payload.farmLocation = farmLocation.trim();
      }
      await api.patch('/users/profile', payload);
      // Update local user state
      if (authUser) {
        const updatedUser = {
          ...authUser,
          name: name.trim(),
          contactNumber,
          address,
          profilePicture,
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
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.new.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await api.patch(`/users/${authUser!.userId}/password`, { password: passwords.new });
      toast.success('Password updated successfully');
      setPasswords({ new: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-emerald-500/30 border-t-emerald-400' : 'border-emerald-500/30 border-t-emerald-500'}`} />
    </div>
  );

  const inputClass = `w-full px-5 py-3 border rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900'}`;
  const labelClass = `block text-xs font-extrabold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`;

  return (
    <div className="space-y-8 max-w-4xl mx-auto relative">
      <div className={`absolute top-0 right-0 w-[25%] h-[25%] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-emerald-950/30' : 'bg-emerald-50/50'}`} />

      <div className="flex flex-col mb-4 relative">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border w-max ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300'}`}>
          <User className="w-3.5 h-3.5" /> Identity
        </div>
        <h1 className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>My Profile</h1>
        <p className={`mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Manage your personal information and account settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Profile Information Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[2rem] border shadow-xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`p-8 border-b ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <div className="flex items-center gap-6">
                <div>
                  <div className="relative group">
                    <div onClick={handleProfilePictureClick} className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black border-4 shadow-sm cursor-pointer overflow-hidden ${isDark ? 'bg-emerald-900/50 text-emerald-400 border-slate-700' : 'bg-emerald-100 text-emerald-600 border-white'}`}>
                      {profilePicture ? (
                        <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        authUser?.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div onClick={handleProfilePictureClick} className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button type="button" onClick={handleProfilePictureClick} className={`text-[11px] font-bold flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${isDark ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}>
                      <Camera className="w-3.5 h-3.5" /> Change Photo
                    </button>
                    {profilePicture && (
                      <button type="button" onClick={handleRemovePhoto} className={`text-[11px] font-bold flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <h2 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{authUser?.name}</h2>
                  <p className={`font-mono text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{authUser?.email}</p>
                  <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                    <ShieldCheck className="w-3 h-3" /> {authUser?.role.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}><User className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} /> Personal Information</h3>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <input type="tel" value={contactNumber} onChange={e => setContactNumber(e.target.value)} className={`${inputClass} pl-10`} placeholder="+63 912 345 6789" />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Complete Address</label>
                  <div className="relative">
                    <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} className={`${inputClass} pl-10 resize-none`} placeholder="123 Barangay San Juan, Province" />
                    <MapPin className="absolute left-3 top-4 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {isFarmer && (
                  <>
                    <div className={`pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                      <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}><Sprout className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} /> Farm Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className={labelClass}>Farm Name</label>
                          <input type="text" value={farmName} onChange={e => setFarmName(e.target.value)} className={inputClass} placeholder="My Sugarcane Farm" />
                        </div>
                        <div>
                          <label className={labelClass}>Farm Location</label>
                          <input type="text" value={farmLocation} onChange={e => setFarmLocation(e.target.value)} className={inputClass} placeholder="Barangay, Municipality, Province" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end pt-4">
                  <button type="submit" disabled={saving} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 ${isDark ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'}`}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                  </button>
                </div>
              </form>
            </div>
          </motion.div>

          {/* Security Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`rounded-[2rem] border shadow-xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="p-8">
              <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}><Lock className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} /> Security Settings</h3>

              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>New Password</label>
                    <input type="password" required value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} className={inputClass} placeholder="Min. 6 characters" minLength={6} />
                  </div>
                  <div>
                    <label className={labelClass}>Confirm New Password</label>
                    <input type="password" required value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} className={inputClass} placeholder="Re-enter password" />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all ${isDark ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'}`}>
                    <Save className="w-4 h-4" /> Update Password
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Sidebar - Profile Overview */}
        <div className="md:col-span-1">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`rounded-[2rem] border shadow-xl overflow-hidden h-full flex flex-col ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className={`font-extrabold tracking-tight text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Profile Summary</h3>
            </div>
            <div className={`p-6 flex-1 space-y-5 ${isDark ? 'bg-slate-800/30' : 'bg-slate-50/50'}`}>
              <div>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Full Name</p>
                <p className={`font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{name || authUser?.name}</p>
              </div>
              <div>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Email</p>
                <p className={`font-mono text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{authUser?.email}</p>
              </div>
              <div>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Contact</p>
                <p className={`font-medium mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{contactNumber || '—'}</p>
              </div>
              <div>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Address</p>
                <p className={`font-medium mt-1 text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{address || '—'}</p>
              </div>
              <div>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Role</p>
                <div className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                  <ShieldCheck className="w-3 h-3" /> {authUser?.role.replace('_', ' ')}
                </div>
              </div>
              {isFarmer && (
                <>
                  <div className={`pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Farm Name</p>
                    <p className={`font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{farmName || '—'}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Farm Location</p>
                    <p className={`font-medium mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{farmLocation || '—'}</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}