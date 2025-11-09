import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mail, MailOpen, Send, Search } from "lucide-react";
import MessageModal from "./MessageModal";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  book_id: string | null;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    email: string;
  };
  recipient?: {
    full_name: string;
    email: string;
  };
  book?: {
    title: string;
  };
}

const MessagesView = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    fetchMessages();
    getCurrentUser();
  }, [filter]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter === "sent") {
        query = query.eq("sender_id", user.id);
      } else if (filter === "received") {
        query = query.eq("recipient_id", user.id);
      } else {
        query = query.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Fetch related data separately
      if (data && data.length > 0) {
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        const recipientIds = [...new Set(data.map(m => m.recipient_id))];
        const bookIds = [...new Set(data.map(m => m.book_id).filter(Boolean))];
        
        const { data: senderProfiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", senderIds);
          
        const { data: recipientProfiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", recipientIds);
          
        const { data: booksData } = bookIds.length > 0 
          ? await supabase.from("books").select("id, title").in("id", bookIds)
          : { data: [] };
        
        const enrichedMessages = data.map(msg => ({
          ...msg,
          sender: senderProfiles?.find(p => p.user_id === msg.sender_id),
          recipient: recipientProfiles?.find(p => p.user_id === msg.recipient_id),
          book: booksData?.find(b => b.id === msg.book_id)
        }));
        
        setMessages(enrichedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", messageId);

      if (error) throw error;
      fetchMessages();
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read && message.recipient_id === currentUserId) {
      markAsRead(message.id);
    }
  };

  const filteredMessages = messages.filter((msg) =>
    msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.sender?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = messages.filter(
    (msg) => !msg.is_read && msg.recipient_id === currentUserId
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">Messages</h2>
        <Button onClick={() => setShowCompose(true)}>
          <Send className="mr-2 h-4 w-4" />
          Compose
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filter === "received" ? "default" : "outline"}
              onClick={() => setFilter("received")}
              size="sm"
            >
              Received {unreadCount > 0 && `(${unreadCount})`}
            </Button>
            <Button
              variant={filter === "sent" ? "default" : "outline"}
              onClick={() => setFilter("sent")}
              size="sm"
            >
              Sent
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading messages...</p>
        ) : filteredMessages.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No messages found</p>
        ) : (
          <div className="space-y-2">
            {filteredMessages.map((message) => (
              <Card
                key={message.id}
                className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                  !message.is_read && message.recipient_id === currentUserId
                    ? "border-primary"
                    : ""
                }`}
                onClick={() => handleMessageClick(message)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {!message.is_read && message.recipient_id === currentUserId ? (
                      <Mail className="h-5 w-5 text-primary mt-1" />
                    ) : (
                      <MailOpen className="h-5 w-5 text-muted-foreground mt-1" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground truncate">
                          {message.sender_id === currentUserId
                            ? `To: ${message.recipient?.full_name}`
                            : `From: ${message.sender?.full_name}`}
                        </p>
                        {message.book && (
                          <Badge variant="secondary" className="text-xs">
                            {message.book.title}
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm text-foreground mb-1">
                        {message.subject}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {message.content}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(message.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {selectedMessage && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {selectedMessage.subject}
                </h3>
                <p className="text-sm text-muted-foreground">
                  From: {selectedMessage.sender?.full_name} ({selectedMessage.sender?.email})
                </p>
                <p className="text-sm text-muted-foreground">
                  To: {selectedMessage.recipient?.full_name} ({selectedMessage.recipient?.email})
                </p>
                {selectedMessage.book && (
                  <p className="text-sm text-muted-foreground">
                    Regarding: {selectedMessage.book.title}
                  </p>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(selectedMessage.created_at).toLocaleString()}
              </span>
            </div>
            <div className="border-t pt-4">
              <p className="text-foreground whitespace-pre-wrap">{selectedMessage.content}</p>
            </div>
          </div>
        </Card>
      )}

      <MessageModal
        isOpen={showCompose}
        onClose={() => {
          setShowCompose(false);
          fetchMessages();
        }}
      />
    </div>
  );
};

export default MessagesView;
