import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Mail, Phone, Users, FileText, Check, X, Edit, Save, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Header } from '@/components/layout/Header';
import { AdminNavigation } from '@/components/layout/AdminNavigation';

interface TeamMember {
  id: string;
  name: string;  // Added name property
  member_name: string;
  email: string;
  phone: string;
  role: string;
  emergency_contact: string;
  emergency_phone: string;
  medical_notes: string;
  created_at: string;
  registration_id: string;
  member_age?: number;
}

export default function RegistrationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [registration, setRegistration] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [tabValue, setTabValue] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchRegistration();
    }
  }, [id]);

  const fetchRegistration = async () => {
    try {
      setLoading(true);
      
      // Fetch registration details
      const { data: registrationData, error: regError } = await supabase
        .from('team_registrations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (regError) throw regError;
      
      setRegistration(registrationData);
      
          // Fetch team members
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('registration_id', id);
      
      if (membersError) throw membersError;
      
      // Transform the data to match our TeamMember interface
      const formattedMembers = (membersData || []).map((member: any) => ({
        ...member,
        name: member.member_name,
        email: member.email || '',
        phone: member.phone || '',
        role: member.role || 'Team Member',
        emergency_contact: member.emergency_contact || '',
        emergency_phone: member.emergency_phone || '',
        medical_notes: member.medical_notes || ''
      }));
      
      setTeamMembers(formattedMembers);
      
    } catch (error) {
      console.error('Error fetching registration:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (registration) {
      setFormData({
        team_name: registration.team_name || '',
        captain_name: registration.captain_name || '',
        email: registration.email || '',
        phone: registration.phone || '',
        soapbox_name: registration.soapbox_name || '',
        soapbox_description: registration.soapbox_description || '',
        category: registration.category || 'open',
        status: registration.status || 'pending',
        race_number: registration.race_number || '',
        heat_time: registration.heat_time || '',
      });
    }
  }, [registration]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('team_registrations')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setRegistration((prev: any) => ({
        ...prev,
        ...formData,
        updated_at: new Date().toISOString()
      }));
      
      setIsEditing(false);
      
      toast({
        title: 'Success',
        description: 'Registration updated successfully',
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('team_registrations')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setRegistration((prev: any) => ({
        ...prev,
        status: newStatus,
        reviewed_at: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      pending: { text: 'Pending Review', className: 'bg-yellow-100 text-yellow-800' },
      approved: { text: 'Approved', className: 'bg-green-100 text-green-800' },
      rejected: { text: 'Rejected', className: 'bg-red-100 text-red-800' },
    };
    
    const statusInfo = statusMap[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={`${statusInfo.className} text-sm`}>{statusInfo.text}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || !registration) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        <p>Loading registration details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isAdmin={true} />
      <div className="flex">
        <AdminNavigation />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Registrations
            </Button>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleSaveChanges}
                    disabled={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Details
                  </Button>
                  {registration.status === 'pending' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleStatusUpdate('approved')}
                        disabled={loading}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        variant="destructive"
                        size="sm" 
                        onClick={() => handleStatusUpdate('rejected')}
                        disabled={loading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </>  
              )}
            </div>
          </div>
          
          <Tabs value={tabValue} onValueChange={setTabValue} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="team">Team Members ({teamMembers.length})</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Team Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Team Name</p>
                        {isEditing ? (
                          <Input
                            id="team_name"
                            name="team_name"
                            value={formData.team_name}
                            onChange={handleInputChange}
                            className="mt-1"
                          />
                        ) : (
                          <p className="font-medium">{registration.team_name}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Category</p>
                        {isEditing ? (
                          <Select 
                            value={formData.category} 
                            onValueChange={(value) => handleSelectChange('category', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="under_12">Under 12</SelectItem>
                              <SelectItem value="open">Open</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="font-medium">{registration.category.replace('_', ' ')}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Team Size</p>
                        <p className="font-medium">{teamMembers.length} members</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Captain Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        {isEditing ? (
                          <Input
                            id="captain_name"
                            name="captain_name"
                            value={formData.captain_name}
                            onChange={handleInputChange}
                            className="mt-1"
                          />
                        ) : (
                          <p className="font-medium">{registration.captain_name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`mailto:${registration.email}`} 
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {registration.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`tel:${registration.phone}`} 
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {registration.phone || 'N/A'}
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Registration Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        {isEditing ? (
                          <Select 
                            value={formData.status} 
                            onValueChange={(value) => handleSelectChange('status', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="waitlist">Waitlist</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="mt-1">
                            {getStatusBadge(registration.status)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Submitted</p>
                        <p className="font-medium">{formatDate(registration.created_at)}</p>
                      </div>
                      {registration.reviewed_at && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {registration.status === 'approved' ? 'Approved' : 'Rejected'} on
                          </p>
                          <p className="font-medium">{formatDate(registration.reviewed_at)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                  <CardDescription>Details provided during registration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Team Description</h3>
                    {isEditing ? (
                      <Textarea
                        id="team_description"
                        name="team_description"
                        value={formData.team_description || ''}
                        onChange={handleInputChange}
                        className="mt-1 min-h-[100px]"
                        placeholder="Enter team description"
                      />
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-md border">
                        {registration.team_description || 'No description provided.'}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Special Requests</h3>
                    {isEditing ? (
                      <Textarea
                        id="special_requests"
                        name="special_requests"
                        value={formData.special_requests || ''}
                        onChange={handleInputChange}
                        className="mt-1 min-h-[100px]"
                        placeholder="Enter special requests"
                      />
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-md border">
                        {registration.special_requests || 'No special requests.'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="team">
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} registered
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No team members found for this registration.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teamMembers.map((member, index) => (
                        <Card key={member.id} className="overflow-hidden">
                          <div className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium">
                                  {member.name}
                                  {index === 0 && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                      Captain
                                    </span>
                                  )}
                                </h3>
                                <p className="text-sm text-muted-foreground">{member.role || 'Team Member'}</p>
                                
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center text-sm">
                                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <a 
                                      href={`mailto:${member.email}`} 
                                      className="text-blue-600 hover:underline"
                                    >
                                      {member.email}
                                    </a>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <a 
                                      href={`tel:${member.phone}`} 
                                      className="text-blue-600 hover:underline"
                                    >
                                      {member.phone || 'N/A'}
                                    </a>
                                  </div>
                                </div>
                                
                                {member.medical_notes && (
                                  <div className="mt-3 p-2 bg-amber-50 border border-amber-100 rounded text-xs text-amber-800">
                                    <p className="font-medium">Medical Notes:</p>
                                    <p>{member.medical_notes}</p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">
                                  Emergency Contact
                                </div>
                                <div className="font-medium">
                                  {member.emergency_contact || 'N/A'}
                                </div>
                                {member.emergency_phone && (
                                  <a 
                                    href={`tel:${member.emergency_phone}`}
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    {member.emergency_phone}
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>Files submitted with this registration</CardDescription>
                </CardHeader>
                <CardContent>
                  {registration.documents && registration.documents.length > 0 ? (
                    <div className="space-y-2">
                      {registration.documents.map((doc, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                        >
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm font-medium">{doc.name || `Document ${index + 1}`}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.type || 'Document'} • {formatFileSize(doc.size)}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(doc.url, '_blank')}
                          >
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-gray-300" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                      <p className="mt-1 text-sm text-gray-500">No files were submitted with this registration.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                  <CardDescription>Recent actions for this registration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      
                      <div className="relative flex items-start pb-6">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">Registration Submitted</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(registration.created_at)}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Team registration was submitted for review.
                          </p>
                        </div>
                      </div>
                      
                      {registration.reviewed_at && (
                        <div className="relative flex items-start">
                          <div className="relative">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              registration.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {registration.status === 'approved' ? (
                                <Check className="h-5 w-5 text-green-600" />
                              ) : (
                                <X className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">
                                Registration {registration.status === 'approved' ? 'Approved' : 'Rejected'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(registration.reviewed_at)}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {registration.status === 'approved' 
                                ? 'The registration was approved.' 
                                : 'The registration was rejected.'}
                            </p>
                            {registration.review_notes && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                                {registration.review_notes}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
