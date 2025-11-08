import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookOpen, Star, Upload, User } from "lucide-react";

interface Profile {
  full_name: string;
  email: string;
  phone: string | null;
  institution: string | null;
}

interface Book {
  id: string;
  title: string;
  author: string;
  upload_date: string;
}

const ProfileDashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (roleData) setRole(roleData.role);

      // Fetch user's books
      const { data: booksData } = await supabase
        .from('books')
        .select('id, title, author, upload_date')
        .eq('uploaded_by', user.id)
        .order('upload_date', { ascending: false });
      
      if (booksData) setUserBooks(booksData);
    } catch (error: any) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">My Dashboard</h3>
        <p className="text-muted-foreground">Personal stats based on your activity</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[hsl(var(--academic-accent))]/10 rounded-lg">
                <User className="w-6 h-6 text-[hsl(var(--academic-accent))]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="text-xl font-bold capitalize">{role || "User"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[hsl(var(--academic-accent))]/10 rounded-lg">
                <Upload className="w-6 h-6 text-[hsl(var(--academic-accent))]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Books Uploaded</p>
                <p className="text-xl font-bold">{userBooks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[hsl(var(--academic-accent))]/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-[hsl(var(--academic-accent))]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Downloads</p>
                <p className="text-xl font-bold">—</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[hsl(var(--academic-accent))]/10 rounded-lg">
                <Star className="w-6 h-6 text-[hsl(var(--academic-accent))]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-xl font-bold">—</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Info & Books */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{profile.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
                {profile.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                )}
                {profile.institution && (
                  <div>
                    <p className="text-sm text-muted-foreground">Institution</p>
                    <p className="font-medium">{profile.institution}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Books You Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            {userBooks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No books uploaded yet</p>
            ) : (
              <div className="space-y-2">
                {userBooks.slice(0, 5).map((book) => (
                  <div key={book.id} className="border border-border rounded p-2">
                    <p className="font-medium text-sm">{book.title}</p>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                  </div>
                ))}
                {userBooks.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{userBooks.length - 5} more books
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileDashboard;
