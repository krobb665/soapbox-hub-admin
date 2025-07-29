
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { Dashboard as DashboardComponent } from '@/components/dashboard/Dashboard';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Error fetching profile:', error);
            setIsAdmin(false);
          } else if (profile) {
            setIsAdmin(profile.is_admin || false);
          } else {
            setIsAdmin(false);
          }
        }
      } catch (error) {
        console.error('Error in getUser:', error);
        setIsAdmin(false);
      }
    };

    getUser();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isAdmin={isAdmin} userEmail={user?.email} />
      <Navigation isAdmin={isAdmin} />
      <DashboardComponent />
    </div>
  );
}
