import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  class: string | null;
  preferred_language: string;
};

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => {
          supabase
            .from("profiles")
            .select("*")
            .eq("user_id", s.user.id)
            .maybeSingle()
            .then(({ data }) => setProfile(data as Profile | null));
        }, 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", s.user.id)
          .maybeSingle()
          .then(({ data }) => setProfile(data as Profile | null));
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, profile, loading, signOut: () => supabase.auth.signOut() };
};
