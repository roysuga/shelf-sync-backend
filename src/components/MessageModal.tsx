import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId?: string;
  recipientId?: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
}

interface Book {
  id: string;
  title: string;
}

const MessageModal = ({ isOpen, onClose, bookId, recipientId }: MessageModalProps) => {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState(recipientId || "");
  const [selectedBook, setSelectedBook] = useState(bookId || "");
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
      fetchBooks();
    }
  }, [isOpen]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email")
        .order("full_name");

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    }
  };

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from("books")
        .select("id, title")
        .order("title");

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  const handleSend = async () => {
    if (!selectedRecipient || !subject.trim() || !content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: selectedRecipient,
        book_id: selectedBook || null,
        subject: subject.trim(),
        content: content.trim(),
      });

      if (error) throw error;

      toast.success("Message sent successfully");
      setSubject("");
      setContent("");
      setSelectedRecipient("");
      setSelectedBook("");
      onClose();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compose Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="recipient">To *</Label>
            <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
              <SelectTrigger id="recipient">
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.user_id} value={profile.user_id}>
                    {profile.full_name} ({profile.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="book">Regarding Book (Optional)</Label>
            <Select value={selectedBook} onValueChange={setSelectedBook}>
              <SelectTrigger id="book">
                <SelectValue placeholder="No book selected" />
              </SelectTrigger>
              <SelectContent>
                {books.map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject"
              maxLength={200}
            />
          </div>

          <div>
            <Label htmlFor="content">Message *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your message"
              rows={6}
              maxLength={2000}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageModal;
