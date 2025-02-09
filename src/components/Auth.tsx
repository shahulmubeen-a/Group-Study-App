import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthError } from '../types';
import { Mail, Lock, UserPlus, LogIn, KeyRound, Chrome } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });
        
        if (error) throw error;
        setMessage("If an account exists with this email, we'll send you a password reset link.");
      } else if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const { data: { user }, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });

        if (signUpError) throw signUpError;
        if (!user) throw new Error('No user returned after signup');

        // Profile will be created automatically by the database trigger
        setMessage('Account created successfully! Please check your email to confirm your account.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError((err as AuthError).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      setError((err as AuthError).message);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setMessage(null);
  };

  return (
    <div className="w-full max-w-md p-8 bg-[#2B2D31] rounded-lg shadow-xl">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {isForgotPassword 
            ? 'Reset Password'
            : isSignUp 
              ? 'Welcome in!'
              : 'Welcome back!'}
        </h2>
        <p className="text-[#B9BBBE]">
          {isForgotPassword
            ? 'Enter your email to receive a reset link'
            : isSignUp
              ? 'Sign up to join the conversation'
              : 'Sign in to continue chatting'}
        </p>
      </div>

      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full mb-4 py-3 bg-white hover:bg-gray-100 text-gray-800 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        <Chrome size={20} />
        Continue with Google
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#1E1F22]"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[#2B2D31] text-[#B9BBBE]">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-[#B9BBBE]" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full pl-11 pr-4 py-3 bg-[#383A40] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865F2] placeholder-[#72767D]"
            />
          </div>
        </div>

        {!isForgotPassword && (
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-[#B9BBBE]" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-11 pr-4 py-3 bg-[#383A40] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865F2] placeholder-[#72767D]"
              />
            </div>
          </div>
        )}

        {isSignUp && (
          <div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 text-[#B9BBBE]" size={20} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                required
                className="w-full pl-11 pr-4 py-3 bg-[#383A40] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865F2] placeholder-[#72767D]"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="text-[#ED4245] text-sm p-3 bg-[#ED4245]/10 rounded-lg">
            {error}
          </div>
        )}

        {message && (
          <div className="text-[#43B581] text-sm p-3 bg-[#43B581]/10 rounded-lg">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? (
            'Please wait...'
          ) : isForgotPassword ? (
            <>
              <Mail size={20} />
              Send Reset Link
            </>
          ) : isSignUp ? (
            <>
              <UserPlus size={20} />
              Sign Up
            </>
          ) : (
            <>
              <LogIn size={20} />
              Sign In
            </>
          )}
        </button>

        <div className="flex flex-col gap-2 text-center">
          {!isForgotPassword && (
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                resetForm();
              }}
              className="text-[#B9BBBE] hover:text-white text-sm transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsForgotPassword(!isForgotPassword);
              setIsSignUp(false);
              resetForm();
            }}
            className="text-[#B9BBBE] hover:text-white text-sm transition-colors"
          >
            {isForgotPassword
              ? 'Back to Sign In'
              : 'Forgot Password?'}
          </button>
        </div>
      </form>
    </div>
  );
}