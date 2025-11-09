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
  const [recipientEmail, setRecipientEmail] = useState("");
  const [selectedBook, setSelectedBook] = useState(bookId || "");
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchBooks();
    }
  }, [isOpen]);

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
    if (!recipientEmail.trim() || !subject.trim() || !content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Look up recipient by email
      const { data: recipientProfile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", recipientEmail.trim().toLowerCase())
        .single();

      if (profileError || !recipientProfile) {
        toast.error("User with this email not found");
        setLoading(false);
        return;
      }

      if (recipientProfile.user_id === user.id) {
        toast.error("You cannot send a message to yourself");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: recipientProfile.user_id,
        book_id: selectedBook || null,
        subject: subject.trim(),
        content: content.trim(),
      });

      if (error) throw error;

      toast.success("Message sent successfully");
      setSubject("");
      setContent("");
      setRecipientEmail("");
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
            <Label htmlFor="recipient">Recipient Email *</Label>
            <Input
              id="recipient"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Enter recipient's email address"
              maxLength={255}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the email address of the user you want to message
            </p>
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
