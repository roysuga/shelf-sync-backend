import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import BooksView from "@/components/BooksView";
import SubmitView from "@/components/SubmitView";
import AuthModal from "@/components/AuthModal";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setCurrentView] = useState('home');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    setCurrentView('home');
  };

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
    setCurrentView('books');
  };

  const handleNavigate = (view: string) => {
    if (['books', 'profiles', 'submit'].includes(view) && !session) {
      toast.error("Please sign in to access this page");
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }
    setCurrentView(view);
  };

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header 
        session={session}
        currentView={currentView}
        onNavigate={handleNavigate}
        onSignOut={handleSignOut}
        onOpenAuth={handleOpenAuth}
      />

      <main className="flex-1 max-w-[1200px] mx-auto my-7 px-4 w-full">
        {currentView === 'home' && <HeroSection />}
        
        {currentView === 'books' && session && (
          <BooksView refreshTrigger={refreshTrigger} />
        )}
        
        {currentView === 'submit' && session && (
          <SubmitView onUploadComplete={handleUploadComplete} />
        )}

        {currentView === 'about' && (
          <div className="border border-border rounded-[10px] p-3.5 bg-white">
            <h3 className="text-2xl font-bold mb-3">About TextAssess</h3>
            <p className="text-muted-foreground">
              TextAssess is a professional platform to collect textbook reviews from educators and students. 
              It helps institutions select suitable textbooks and allows users to contact reviewers for 
              clarification or collaboration.
            </p>
          </div>
        )}

        {currentView === 'contact' && (
          <div className="border border-border rounded-[10px] p-3.5 bg-white">
            <h3 className="text-2xl font-bold mb-3">Contact</h3>
            <p className="text-muted-foreground mb-4">
              For queries about the app, reach out through the form below.
            </p>
            <p className="text-sm text-muted-foreground">
              Contact form integration coming soon. For now, please use the platform features to communicate with other users.
            </p>
          </div>
        )}
      </main>

      <footer className="bg-[hsl(var(--academic-beige))] border-t border-border py-3 px-5 mt-auto">
        <div className="max-w-[1200px] mx-auto text-center text-sm text-muted-foreground">
          © 2025 TextAssess. A platform for textbook quality assessment.
        </div>
      </footer>

      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
      />
    </div>
  );
};

export default Index;