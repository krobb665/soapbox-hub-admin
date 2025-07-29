import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { AdminNavigation } from '@/components/layout/AdminNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, BarChart2 } from 'lucide-react';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTeams: 0,
    pendingRegistrations: 0,
    approvedTeams: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .maybeSingle();
          
          if (error || !profile?.is_admin) {
            navigate('/dashboard');
          } else {
            fetchStats();
          }
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const [
        { count: totalTeams },
        { count: pendingRegistrations },
        { count: approvedTeams }
      ] = await Promise.all([
        supabase.from('team_registrations').select('*', { count: 'exact' }),
        supabase.from('team_registrations').select('*', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('team_registrations').select('*', { count: 'exact' }).eq('status', 'approved')
      ]);

      setStats({
        totalTeams: totalTeams || 0,
        pendingRegistrations: pendingRegistrations || 0,
        approvedTeams: approvedTeams || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminNavigation user={user} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header isAdmin={true} userEmail={user?.email} />
        <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTeams}</div>
              <p className="text-xs text-muted-foreground">
                {stats.approvedTeams} approved • {stats.pendingRegistrations} pending
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRegistrations}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingRegistrations === 0 ? 'All caught up!' : 'Needs review'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalTeams > 0 
                  ? `${Math.round((stats.approvedTeams / stats.totalTeams) * 100)}%` 
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.approvedTeams} out of {stats.totalTeams} teams
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common admin tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <button 
                onClick={() => navigate('/admin/teams')}
                className="w-full text-left p-3 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Manage Teams
              </button>
              <button 
                onClick={() => navigate('/admin/registrations')}
                className="w-full text-left p-3 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                View All Registrations
              </button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  No recent activity
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </main>
      </div>
    </div>
  );
}
