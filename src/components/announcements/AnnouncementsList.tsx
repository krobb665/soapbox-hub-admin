
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Megaphone, AlertCircle, Info, Users } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  audience: string;
  created_at: string;
}

export const AnnouncementsList = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching announcements:', error);
        throw error;
      }

      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error in fetchAnnouncements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load announcements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getAnnouncementIcon = (category: string) => {
    switch (category) {
      case 'urgent': return AlertCircle;
      case 'info': return Info;
      default: return Megaphone;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case 'open': return 'bg-orange-100 text-orange-800';
      case 'under_12': return 'bg-purple-100 text-purple-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-64">Loading announcements...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Announcements</h1>
        <p className="text-gray-600">Stay updated with the latest race information</p>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements yet</h3>
            <p className="text-gray-500">Check back later for race updates and important information.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {announcements.map((announcement) => {
            const Icon = getAnnouncementIcon(announcement.category);
            return (
              <Card key={announcement.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-6 w-6 ${
                        announcement.category === 'urgent' ? 'text-red-500' : 
                        announcement.category === 'info' ? 'text-blue-500' : 'text-gray-500'
                      }`} />
                      <div>
                        <CardTitle className="text-xl">{announcement.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(announcement.created_at).toLocaleDateString()} at{' '}
                          {new Date(announcement.created_at).toLocaleTimeString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={getCategoryColor(announcement.category)}>
                        {announcement.category}
                      </Badge>
                      <Badge className={getAudienceColor(announcement.audience)}>
                        <Users className="h-3 w-3 mr-1" />
                        {announcement.audience === 'all' ? 'All Teams' : 
                         announcement.audience === 'open' ? 'Open Category' : 'Under 12'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
