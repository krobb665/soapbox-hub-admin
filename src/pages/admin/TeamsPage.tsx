import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { AdminNavigation } from '@/components/layout/AdminNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Plus, Download, Users, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Team {
  id: string;
  team_name: string;
  captain_name: string;
  email: string;
  phone: string;
  category: string;
  status: string;  // Made more flexible to handle any status
  created_at: string | null;
  updated_at: string | null;
  member_count: number;
  soapbox_name: string;
  soapbox_description: string | null;
  file_url: string | null;
  race_number: string | null;
  heat_time: string | null;
  team_members?: Array<{ count: number }>;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      
      // Fetch team registrations with member counts
      const { data: registrations, error: regError } = await supabase
        .from('team_registrations')
        .select(`
          *,
          team_members(count)
        `)
        .order('created_at', { ascending: false });
      
      if (regError) throw regError;
      
      // Transform the data to include member counts
      const teamsWithCounts = (registrations || []).map(registration => ({
        ...registration,
        member_count: registration.team_members?.[0]?.count || 0,
        status: registration.status || 'pending', // Ensure status has a default value
      } as Team));
      
      setTeams(teamsWithCounts);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (teamId) => {
    navigate(`/admin/teams/${teamId}/edit`);
  };

  const handleView = (teamId) => {
    navigate(`/admin/teams/${teamId}`);
  };

  const handleStatusChange = async (teamId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('team_registrations')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);
      
      if (error) throw error;
      
      // Update local state
      setTeams(teams.map(team => 
        team.id === teamId ? { ...team, status: newStatus as any } : team
      ));
      
      toast({
        title: 'Success',
        description: `Team status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating team status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update team status',
        variant: 'destructive',
      });
    }
  };

  const filteredTeams = teams.filter(team => {
    if (!team) return false;
    const query = searchQuery.toLowerCase();
    return (
      (team.team_name || '').toLowerCase().includes(query) ||
      (team.captain_name || '').toLowerCase().includes(query) ||
      (team.email || '').toLowerCase().includes(query) ||
      (team.category || '').toLowerCase().includes(query) ||
      (team.status || '').toLowerCase().includes(query) ||
      (team.soapbox_name || '').toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      approved: { className: 'bg-green-100 text-green-800', label: 'Approved' },
      pending: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      rejected: { className: 'bg-red-100 text-red-800', label: 'Rejected' },
      waitlist: { className: 'bg-blue-100 text-blue-800', label: 'Waitlist' },
    };
    
    const statusInfo = statusMap[status] || { className: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isAdmin={true} />
      <div className="flex">
        <AdminNavigation />
        
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Team Management</h1>
            <Button onClick={() => navigate('/admin/teams/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Team
            </Button>
          </div>
          
          <div className="rounded-md border bg-white mb-6">
            <div className="p-4 border-b">
              <div className="relative max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search teams..."
                  className="w-full bg-background pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Captain</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading teams...
                    </TableCell>
                  </TableRow>
                ) : filteredTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No teams found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.team_name}</TableCell>
                      <TableCell>{team.captain_name}</TableCell>
                      <TableCell>{team.category}</TableCell>
                      <TableCell>{team.member_count} members</TableCell>
                      <TableCell>{getStatusBadge(team.status)}</TableCell>
                      <TableCell>{new Date(team.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/admin/registrations/${team.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/registrations/${team.id}`)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(team.id, 'approved')}>
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(team.id, 'rejected')}>
                              Reject
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(team.id, 'waitlist')}>
                              Move to Waitlist
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing <strong>{filteredTeams.length}</strong> of <strong>{teams.length}</strong> teams
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={() => navigate(`/admin/registrations/${teams[0].id}`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="ml-auto">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
