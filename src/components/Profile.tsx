import React, { useState, useEffect } from 'react';
import { UserCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onProfileUpdate?: (profile: UserProfile) => void;
}

export function Profile({ isOpen, onClose, userId, userEmail, onProfileUpdate }: ProfileProps) {
  const [profile, setProfile] = useState<UserProfile>({
    id: userId,
    name: userEmail.split('@')[0],
    bio: "I'm here to learn and teach",
    topics: [],
    created_at: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchProfile();
  }, [isOpen, userId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          name: profile.name,
          bio: profile.bio,
          topics: profile.topics
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        onProfileUpdate?.(data);
      }
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl bg-[#2B2D31] rounded-lg shadow-xl">
        <div className="p-4 border-b border-[#1E1F22] flex items-center justify-between bg-gradient-to-r from-[#5865F2] to-[#7289DA]">
          <div className="flex items-center gap-3">
            <UserCircle className="text-white" size={24} />
            <h2 className="text-xl font-semibold text-white">Your Profile</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center text-[#B9BBBE]">Loading...</div>
        ) : (
          <>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[#B9BBBE] mb-2">Display Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#383A40] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                />
              </div>

              <div>
                <label className="block text-[#B9BBBE] mb-2">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full px-4 py-2 bg-[#383A40] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865F2] h-24 resize-none"
                />
              </div>

              <div>
                <label className="block text-[#B9BBBE] mb-2">Topics of Interest</label>
                <input
                  type="text"
                  value={profile.topics.join(', ')}
                  onChange={(e) => setProfile({
                    ...profile,
                    topics: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                  className="w-full px-4 py-2 bg-[#383A40] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                  placeholder="gaming, music, technology"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#1E1F22] flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[#B9BBBE] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}