
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
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(profile?.is_admin || false);
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
