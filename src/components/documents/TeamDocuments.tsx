
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Download, Eye, Calendar } from 'lucide-react';

interface TeamDocument {
  id: string;
  title: string;
  file_url: string;
  created_at: string;
  registration_id: string;
  team_name?: string;
}

export const TeamDocuments = () => {
  const [documents, setDocuments] = useState<TeamDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamDocuments();
  }, []);

  const fetchTeamDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('team_documents')
        .select(`
          id,
          title,
          file_url,
          created_at,
          registration_id,
          team_registrations(team_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }

      const documentsWithTeamName = data.map(doc => ({
        ...doc,
        team_name: (doc.team_registrations as any)?.team_name
      }));

      setDocuments(documentsWithTeamName);
    } catch (error) {
      console.error('Error in fetchTeamDocuments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileUrl: string, title: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('team-documents')
        .download(fileUrl.split('/').pop() || '');

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  const handleView = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-64">Loading documents...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Documents</h1>
        <p className="text-gray-600">Access your team-specific documents and forms</p>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500">
              Your team-specific documents will appear here once uploaded by the organizers.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((document) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(document.created_at).toLocaleDateString()}
                  </div>
                </div>
                <CardTitle className="text-lg">{document.title}</CardTitle>
                {document.team_name && (
                  <CardDescription>Team: {document.team_name}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(document.file_url)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(document.file_url, document.title)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
