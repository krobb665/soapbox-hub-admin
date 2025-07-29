import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { AdminNavigation } from '@/components/layout/AdminNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Check, X, Clock, Download, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('team_registrations')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const { error } = await supabase
        .from('team_registrations')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh the registrations list
      fetchRegistrations();
    } catch (error) {
      console.error('Error approving registration:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      const { error } = await supabase
        .from('team_registrations')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh the registrations list
      fetchRegistrations();
    } catch (error) {
      console.error('Error rejecting registration:', error);
    }
  };

  const filteredRegistrations = registrations.filter(registration => {
    const matchesSearch = 
      registration.team_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      registration.captain_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      registration.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || registration.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      approved: { text: 'Approved', className: 'bg-green-100 text-green-800' },
      rejected: { text: 'Rejected', className: 'bg-red-100 text-red-800' },
    };
    
    const { text, className } = statusMap[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={className}>{text}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isAdmin={true} />
      <div className="flex">
        <AdminNavigation />
        
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Team Registrations</h1>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border bg-white mb-6">
            <div className="p-4 border-b flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search registrations..."
                  className="w-full bg-background pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Captain</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading registrations...
                    </TableCell>
                  </TableRow>
                ) : filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No registrations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">{registration.team_name}</TableCell>
                      <TableCell>{registration.captain_name}</TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{registration.email}</div>
                        <div className="text-sm text-muted-foreground">{registration.phone}</div>
                      </TableCell>
                      <TableCell>{registration.category}</TableCell>
                      <TableCell>{getStatusBadge(registration.status)}</TableCell>
                      <TableCell>{new Date(registration.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {registration.status === 'pending' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 text-green-600 hover:bg-green-50"
                                onClick={() => handleApprove(registration.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 text-red-600 hover:bg-red-50"
                                onClick={() => handleReject(registration.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/admin/registrations/${registration.id}`)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>Send Message</DropdownMenuItem>
                              <DropdownMenuItem>Add Note</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing <strong>{filteredRegistrations.length}</strong> of <strong>{registrations.length}</strong> registrations
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={true}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={true}>
                  Next
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
