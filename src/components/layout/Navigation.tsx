
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  UserPlus, 
  FileText, 
  Megaphone, 
  Calendar,
  Settings,
  Users
} from 'lucide-react';

interface NavigationProps {
  isAdmin?: boolean;
}

export const Navigation = ({ isAdmin }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/register', label: 'Register Team', icon: UserPlus },
    { path: '/documents', label: 'Documents', icon: FileText },
    { path: '/announcements', label: 'Announcements', icon: Megaphone },
    { path: '/schedule', label: 'Race Schedule', icon: Calendar },
  ];

  const adminItems = [
    { path: '/admin', label: 'Admin Dashboard', icon: Settings },
    { path: '/admin/teams', label: 'Manage Teams', icon: Users },
  ];

  const allItems = isAdmin ? [...navItems, ...adminItems] : navItems;

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto py-2">
          {allItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                onClick={() => navigate(item.path)}
                className="flex items-center space-x-2 whitespace-nowrap"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
