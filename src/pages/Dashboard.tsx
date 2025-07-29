
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { Dashboard as DashboardComponent } from '@/components/dashboard/Dashboard';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isAdmin={isAdmin} userEmail={user?.email} />
      <Navigation isAdmin={isAdmin} />
      
      {isAdmin && (
        <div className="p-4 flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => navigate('/admin')}
          >
            <Settings className="h-4 w-4" />
            Admin Dashboard
          </Button>
        </div>
      )}
      
      <DashboardComponent />
    </div>
  );
}
