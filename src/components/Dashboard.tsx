import React, { useState, useEffect } from 'react';
import { Menu, Plus, Users, LogOut, UserCircle, MessageSquare, X } from 'lucide-react';
import { supabase, signOut, retryOperation } from '../lib/supabase';
import { Group, UserProfile } from '../types';
import { CreateGroupModal } from './CreateGroupModal';
import { Profile } from './Profile';
import { JoinGroupModal } from './JoinGroupModal';

interface DashboardProps {
  userId: string;
  onGroupSelect: (groupId: string) => void;
}

export function Dashboard({ userId, onGroupSelect }: DashboardProps) {
  const [createdGroups, setCreatedGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchGroups();
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const maxRetries = 3;
      let retryCount = 0;
      let profile = null;

      while (retryCount < maxRetries && !profile) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          profile = data;
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        retryCount++;
      }

      if (profile) {
        setProfile(profile);
        document.body.className = profile.theme || 'dark';
        setError(null);
      } else {
        throw new Error('Could not fetch profile after multiple attempts');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please refresh the page.');
    }
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data: memberGroups, error: memberError } = await retryOperation(() =>
        supabase
          .from('group_members')
          .select('group_id, is_creator')
          .eq('user_id', userId)
      );

      if (memberError) throw memberError;

      const createdGroupIds = memberGroups
        .filter(mg => mg.is_creator)
        .map(mg => mg.group_id);

      const joinedGroupIds = memberGroups
        .filter(mg => !mg.is_creator)
        .map(mg => mg.group_id);

      if (createdGroupIds.length > 0) {
        const { data: createdGroupsData, error: createdGroupsError } = await retryOperation(() =>
          supabase
            .from('groups')
            .select('*')
            .in('id', createdGroupIds)
        );

        if (createdGroupsError) throw createdGroupsError;
        setCreatedGroups(createdGroupsData || []);
      } else {
        setCreatedGroups([]);
      }

      if (joinedGroupIds.length > 0) {
        const { data: joinedGroupsData, error: joinedGroupsError } = await retryOperation(() =>
          supabase
            .from('groups')
            .select('*')
            .in('id', joinedGroupIds)
        );

        if (joinedGroupsError) throw joinedGroupsError;
        setJoinedGroups(joinedGroupsData || []);
      } else {
        setJoinedGroups([]);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (name: string, description: string, topics: string[], maxMembers: number) => {
    const inviteCode = Array.from(Array(12), () => 
      Math.floor(Math.random() * 36).toString(36)
    ).join('');

    const { data: group, error: createError } = await supabase
      .from('groups')
      .insert([{ 
        name, 
        description, 
        topics, 
        invite_code: inviteCode,
        max_members: maxMembers
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating group:', createError);
      return;
    }

    const { error: memberError } = await supabase
      .from('group_members')
      .insert([{ 
        group_id: group.id, 
        user_id: userId,
        is_creator: true 
      }]);

    if (memberError) {
      console.error('Error joining group:', memberError);
      return;
    }

    await fetchGroups();
    setIsCreateModalOpen(false);
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleCopyInviteCode = (inviteCode: string) => {
    navigator.clipboard.writeText(inviteCode);
  };

  const renderGroupList = (groups: Group[], isCreated: boolean) => {
    if (groups.length === 0) {
      return (
        <div className="bg-[#2B2D31] rounded-lg p-8 text-center">
          <Users size={48} className="text-[#B9BBBE] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            {isCreated ? 'No Created Groups' : 'No Joined Groups'}
          </h2>
          <p className="text-[#B9BBBE] mb-4">
            {isCreated 
              ? 'Create your first group to start chatting!'
              : 'Join a group using an invite code to start chatting!'}
          </p>
          <button
            onClick={() => isCreated ? setIsCreateModalOpen(true) : setIsJoinModalOpen(true)}
            className="px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors"
          >
            {isCreated ? 'Create a Group' : 'Join a Group'}
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(group => (
          <div
            key={group.id}
            className="bg-[#2B2D31] rounded-lg p-6 hover:bg-[#32353B] transition-colors cursor-pointer"
            onClick={() => onGroupSelect(group.id)}
          >
            <h3 className="text-xl font-semibold text-white mb-2">{group.name}</h3>
            <p className="text-[#B9BBBE] mb-4 line-clamp-2">{group.description}</p>
            <div className="flex items-center gap-4 text-sm text-[#B9BBBE]">
              <div className="flex items-center gap-1">
                <Users size={16} />
                <span>{group.max_members}</span>
              </div>
              {isCreated && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyInviteCode(group.invite_code);
                  }}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <Plus size={16} />
                  <span>Copy Code</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const MenuDropdown = () => {
    if (!isMenuOpen) return null;

    return (
      <div className="absolute right-0 top-full mt-2 w-48 bg-[#2B2D31] rounded-lg shadow-lg overflow-hidden z-50">
        <button
          onClick={() => {
            setIsProfileOpen(true);
            setIsMenuOpen(false);
          }}
          className="w-full px-4 py-3 text-left text-white hover:bg-[#32353B] transition-colors flex items-center gap-2"
        >
          <UserCircle size={20} />
          Profile
        </button>
        <button
          onClick={() => {
            setIsCreateModalOpen(true);
            setIsMenuOpen(false);
          }}
          className="w-full px-4 py-3 text-left text-white hover:bg-[#32353B] transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Create Group
        </button>
        <button
          onClick={() => {
            setIsJoinModalOpen(true);
            setIsMenuOpen(false);
          }}
          className="w-full px-4 py-3 text-left text-white hover:bg-[#32353B] transition-colors flex items-center gap-2"
        >
          <Users size={20} />
          Join Group
        </button>
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-3 text-left text-[#ED4245] hover:bg-[#32353B] transition-colors flex items-center gap-2"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#313338] flex items-center justify-center">
        <div className="text-white">Loading your groups...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-200">
      <div className="bg-[var(--bg-secondary)] border-b border-[#1E1F22] p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <MessageSquare className="text-[#5865F2]" size={32} />
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                Welcome, {profile?.name || 'newcomer'}!
              </h1>
            </div>
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-[#32353B] rounded-lg transition-colors"
              >
                {isMenuOpen ? (
                  <X size={24} className="text-white" />
                ) : (
                  <Menu size={24} className="text-white" />
                )}
              </button>
              <MenuDropdown />
            </div>
          </div>

          {error && (
            <div className="bg-[#ED4245]/10 text-[#ED4245] p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Created Groups</h2>
              {renderGroupList(createdGroups, true)}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Joined Groups</h2>
              {renderGroupList(joinedGroups, false)}
            </div>
          </div>
        </div>
      </div>

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateGroup}
      />

      <JoinGroupModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        userId={userId}
        onJoinSuccess={() => fetchGroups()}
      />

      <Profile
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userId={userId}
        userEmail={profile?.email || ''}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
}