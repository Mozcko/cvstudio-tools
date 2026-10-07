import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/astro/react';
import { api, type Plan, type UserProfile } from '../lib/api';

/** The signed-in user's plan. Everything is "free" until the profile has loaded. */
export default function useProStatus() {
  const { userId, getToken, isLoaded } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!isLoaded || !userId) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const token = await getToken();
        setProfile(await api.getUserProfile(token));
      } catch (error) {
        console.error('Error fetching pro status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [userId, isLoaded, getToken]);

  const isPro = profile?.is_pro ?? false;
  const plan: Plan = profile?.plan ?? (isPro ? 'sprint' : 'free');

  return {
    isPro,
    plan,
    isPremium: profile?.is_premium ?? false,
    usage: profile?.usage ?? null,
    loading,
  };
}
