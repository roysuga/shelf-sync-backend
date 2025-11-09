import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, LogOut, Mail } from "lucide-react";

interface HeaderProps {
  session: Session | null;
  currentView: string;
  onNavigate: (view: string) => void;
  onSignOut: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  isAdmin?: boolean;
}

const Header = ({ session, currentView, onNavigate, onSignOut, onOpenAuth, isAdmin }: HeaderProps) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (session) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("messages")
        .select("id", { count: "exact" })
        .eq("recipient_id", user.id)
        .eq("is_read", false);

      if (!error && data) {
        setUnreadCount(data.length);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', public: true },
    { id: 'books', label: 'Books', public: false },
    { id: 'profiles', label: 'Profile', public: false },
    { id: 'submit', label: 'Submit', public: false },
    { id: 'about', label: 'About', public: true },
    { id: 'contact', label: 'Contact', public: true },
  ];
  
  const adminNavItem = { id: 'admin', label: 'Admin', public: false };

  return (
    <header className="bg-[hsl(var(--academic-beige))] border-b border-border">
      <div className="max-w-[1200px] mx-auto px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap">
        <a 
          className="font-bold tracking-wide text-[#1f2937] text-xl flex items-center gap-2 cursor-pointer"
          onClick={() => onNavigate('home')}
        >
          <BookOpen className="h-5 w-5" />
          TextAssess
        </a>

        <nav className="flex items-center gap-3.5 flex-wrap flex-1 justify-center min-w-[280px]">
          {navItems.map(item => (
            (!item.public && !session) ? null : (
              <a
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="text-[#1f2937] hover:text-[hsl(var(--academic-accent))] cursor-pointer transition-colors"
              >
                {item.label}
              </a>
            )
          ))}
          {session && (
            <a
              onClick={() => onNavigate('messages')}
              className="text-[#1f2937] hover:text-[hsl(var(--academic-accent))] cursor-pointer transition-colors relative inline-flex items-center gap-1"
            >
              <Mail className="h-4 w-4" />
              Messages
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="h-5 min-w-5 flex items-center justify-center p-1 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </a>
          )}
          {isAdmin && session && (
            <a
              onClick={() => onNavigate('admin')}
              className="text-[#1f2937] hover:text-[hsl(var(--academic-accent))] cursor-pointer transition-colors font-semibold"
            >
              🛡️ Admin
            </a>
          )}
        </nav>

        <div className="flex items-center gap-2 min-w-[160px] justify-end">
          {!session ? (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onOpenAuth('login')}
                className="hidden md:inline-flex"
              >
                Login
              </Button>
              <Button 
                size="sm"
                onClick={() => onOpenAuth('signup')}
                className="hidden md:inline-flex bg-[hsl(var(--academic-accent))] hover:bg-[hsl(var(--academic-accent))]/90"
              >
                Sign up
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden md:inline">
                {session.user.email}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onSignOut}
              >
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Sign out</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;