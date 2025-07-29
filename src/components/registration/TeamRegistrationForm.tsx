
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Upload, X, Plus } from 'lucide-react';

interface TeamMember {
  id: string;
  member_name: string;
  member_age: number;
}

export const TeamRegistrationForm = () => {
  const [formData, setFormData] = useState({
    team_name: '',
    captain_name: '',
    email: '',
    phone: '',
    soapbox_name: '',
    soapbox_description: '',
    category: '',
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { id: Date.now().toString(), member_name: '', member_age: 0 }]);
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(member => member.id !== id));
  };

  const updateTeamMember = (id: string, field: string, value: string | number) => {
    setTeamMembers(teamMembers.map(member => 
      member.id === id ? { ...member, [field]: value } : member
    ));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('team-files')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('team-files')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let fileUrl = '';
      if (file) {
        fileUrl = await uploadFile(file);
      }

      const { data: registration, error: registrationError } = await supabase
        .from('team_registrations')
        .insert({
          user_id: user.id,
          team_name: formData.team_name,
          captain_name: formData.captain_name,
          email: formData.email,
          phone: formData.phone,
          soapbox_name: formData.soapbox_name,
          soapbox_description: formData.soapbox_description,
          category: formData.category,
          file_url: fileUrl,
        })
        .select()
        .single();

      if (registrationError) throw registrationError;

      // Add team members
      if (teamMembers.length > 0) {
        const membersToInsert = teamMembers
          .filter(member => member.member_name && member.member_age > 0)
          .map(member => ({
            registration_id: registration.id,
            member_name: member.member_name,
            member_age: member.member_age,
          }));

        if (membersToInsert.length > 0) {
          const { error: membersError } = await supabase
            .from('team_members')
            .insert(membersToInsert);

          if (membersError) throw membersError;
        }
      }

      toast({
        title: 'Success!',
        description: 'Team registration submitted successfully',
      });

      // Reset form
      setFormData({
        team_name: '',
        captain_name: '',
        email: '',
        phone: '',
        soapbox_name: '',
        soapbox_description: '',
        category: '',
      });
      setTeamMembers([]);
      setFile(null);

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit registration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Register Your Team</CardTitle>
          <CardDescription>
            Fill out this form to register your team for the Castle Douglas Soapbox Derby
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="team_name">Team Name *</Label>
                <Input
                  id="team_name"
                  value={formData.team_name}
                  onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="captain_name">Captain Name *</Label>
                <Input
                  id="captain_name"
                  value={formData.captain_name}
                  onChange={(e) => setFormData({ ...formData, captain_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="soapbox_name">Soapbox Name *</Label>
                <Input
                  id="soapbox_name"
                  value={formData.soapbox_name}
                  onChange={(e) => setFormData({ ...formData, soapbox_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_12">Under 12</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="soapbox_description">Soapbox Description</Label>
              <Textarea
                id="soapbox_description"
                value={formData.soapbox_description}
                onChange={(e) => setFormData({ ...formData, soapbox_description: e.target.value })}
                placeholder="Describe your soapbox design..."
              />
            </div>

            {/* Team Members */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Team Members</Label>
                <Button type="button" variant="outline" onClick={addTeamMember}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Input
                      placeholder="Member Name"
                      value={member.member_name}
                      onChange={(e) => updateTeamMember(member.id, 'member_name', e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Age"
                      value={member.member_age || ''}
                      onChange={(e) => updateTeamMember(member.id, 'member_age', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTeamMember(member.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Safety Forms / Media Upload</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file')?.click()}
                  className="mb-2"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
                {file && (
                  <p className="text-sm text-gray-600">{file.name}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Upload safety forms, photos, or other relevant documents
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Registration'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
