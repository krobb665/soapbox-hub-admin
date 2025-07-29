import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { AdminNavigation } from '@/components/layout/AdminNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Plus, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setTeams(data || []);
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

  const handleStatusChange = async (teamId, newStatus) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ status: newStatus })
        .eq('id', teamId);
      
      if (error) throw error;
      
      // Refresh the teams list
      fetchTeams();
    } catch (error) {
      console.error('Error updating team status:', error);
    }
  };

  const filteredTeams = teams.filter(team => 
    team.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.captain_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusMap = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
    };
    
    const className = statusMap[status] || 'bg-gray-100 text-gray-800';
    return <Badge className={className}>{status}</Badge>;
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
                      <TableCell>{team.member_count || 0} / {team.max_members || '∞'}</TableCell>
                      <TableCell>{getStatusBadge(team.status)}</TableCell>
                      <TableCell>{new Date(team.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(team.id)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(team.id)}>
                              Edit Team
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(team.id, 'active')}
                              disabled={team.status === 'active'}
                            >
                              Mark as Active
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(team.id, 'inactive')}
                              disabled={team.status === 'inactive'}
                            >
                              Mark as Inactive
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleStatusChange(team.id, 'suspended')}
                              disabled={team.status === 'suspended'}
                            >
                              Suspend Team
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
