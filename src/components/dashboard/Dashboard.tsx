
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Car, Users, Clock, AlertCircle, Megaphone } from 'lucide-react';

interface TeamRegistration {
  id: string;
  team_name: string;
  captain_name: string;
  category: string;
  status: string;
  race_number: string | null;
  heat_time: string | null;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  category: string;
  created_at: string;
}

export const Dashboard = () => {
  const [registrations, setRegistrations] = useState<TeamRegistration[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [registrationsResult, announcementsResult] = await Promise.all([
        supabase
          .from('team_registrations')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      if (registrationsResult.error) {
        console.error('Error fetching registrations:', registrationsResult.error);
        throw registrationsResult.error;
      }
      if (announcementsResult.error) {
        console.error('Error fetching announcements:', announcementsResult.error);
        throw announcementsResult.error;
      }

      setRegistrations(registrationsResult.data || []);
      setAnnouncements(announcementsResult.data || []);
    } catch (error) {
      console.error('Error in fetchData:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'waitlist': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    return category === 'under_12' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800';
  };

  const getAnnouncementIcon = (category: string) => {
    return category === 'urgent' ? AlertCircle : 
           category === 'info' ? Clock : 
           Car;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Dashboard</h1>
        <p className="text-gray-600">Welcome to the Castle Douglas Soapbox Derby portal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Registrations */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Your Team Registrations</span>
              </CardTitle>
              <CardDescription>
                Manage your team registrations and view their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {registrations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No team registrations yet. Click "Register Team" to get started!
                </p>
              ) : (
                <div className="space-y-4">
                  {registrations.map((registration) => (
                    <div key={registration.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{registration.team_name}</h3>
                          <p className="text-sm text-gray-600">Captain: {registration.captain_name}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge className={getStatusColor(registration.status)}>
                            {registration.status}
                          </Badge>
                          <Badge className={getCategoryColor(registration.category)}>
                            {registration.category === 'under_12' ? 'Under 12' : 'Open'}
                          </Badge>
                        </div>
                      </div>
                      {registration.race_number && (
                        <div className="flex space-x-4 text-sm text-gray-600">
                          <span>Race #: {registration.race_number}</span>
                          {registration.heat_time && (
                            <span>Heat Time: {registration.heat_time}</span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Registered: {new Date(registration.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Announcements */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Megaphone className="h-5 w-5" />
                <span>Latest Announcements</span>
              </CardTitle>
              <CardDescription>
                Recent updates and important information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No announcements yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => {
                    const Icon = getAnnouncementIcon(announcement.category);
                    return (
                      <div key={announcement.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-start space-x-2">
                          <Icon className={`h-4 w-4 mt-1 ${
                            announcement.category === 'urgent' ? 'text-red-500' : 'text-blue-500'
                          }`} />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{announcement.title}</h4>
                            <p className="text-xs text-gray-600 mt-1">{announcement.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(announcement.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
