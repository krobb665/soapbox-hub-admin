
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Clock, Trophy, Car, Download } from 'lucide-react';

interface RaceEntry {
  id: string;
  team_name: string;
  soapbox_name: string;
  category: string;
  race_number: string | null;
  heat_time: string | null;
  status: string;
}

export const RaceSchedule = () => {
  const [raceEntries, setRaceEntries] = useState<RaceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchRaceSchedule();
  }, []);

  const fetchRaceSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('team_registrations')
        .select('id, team_name, soapbox_name, category, race_number, heat_time, status')
        .eq('status', 'approved')
        .order('race_number', { ascending: true });

      if (error) {
        console.error('Error fetching race schedule:', error);
        throw error;
      }

      setRaceEntries(data || []);
    } catch (error) {
      console.error('Error in fetchRaceSchedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to load race schedule',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = raceEntries.filter(entry => 
    selectedCategory === 'all' || entry.category === selectedCategory
  );

  const getCategoryColor = (category: string) => {
    return category === 'under_12' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800';
  };

  const exportToCSV = () => {
    const csvContent = [
      'Team Name,Soapbox Name,Category,Race Number,Heat Time',
      ...filteredEntries.map(entry => 
        `"${entry.team_name}","${entry.soapbox_name}","${entry.category}","${entry.race_number || 'TBD'}","${entry.heat_time || 'TBD'}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'race-schedule.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-64">Loading race schedule...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Race Schedule</h1>
        <p className="text-gray-600">View the official race schedule and heat times</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Race Schedule</span>
            </span>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All Categories
                </Button>
                <Button
                  variant={selectedCategory === 'under_12' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('under_12')}
                >
                  Under 12
                </Button>
                <Button
                  variant={selectedCategory === 'open' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('open')}
                >
                  Open
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Showing {filteredEntries.length} registered teams
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No teams scheduled yet</h3>
              <p className="text-gray-500">Race numbers and heat times will be assigned soon.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Race #</TableHead>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Soapbox Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Heat Time</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono">
                      {entry.race_number || <span className="text-gray-500">TBD</span>}
                    </TableCell>
                    <TableCell className="font-medium">{entry.team_name}</TableCell>
                    <TableCell>{entry.soapbox_name}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(entry.category)}>
                        {entry.category === 'under_12' ? 'Under 12' : 'Open'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.heat_time || <span className="text-gray-500">TBD</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
