import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Trash2, User, Mail, Phone } from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  isbn: string;
  file_name: string;
  file_path: string;
  file_size: number;
  upload_date: string;
  uploaded_by: string;
  uploader_profile?: {
    full_name: string;
    email: string;
    phone: string | null;
    institution: string | null;
  };
}

interface AdminBooksViewProps {
  refreshTrigger: number;
}

const AdminBooksView = ({ refreshTrigger }: AdminBooksViewProps) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, [refreshTrigger]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('*')
        .order('upload_date', { ascending: false });

      if (booksError) throw booksError;

      // Fetch profiles separately
      const uploaderIds = [...new Set(booksData?.map(b => b.uploaded_by) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone, institution')
        .in('user_id', uploaderIds);

      // Map profiles to books
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      const booksWithProfiles = booksData?.map(book => ({
        ...book,
        uploader_profile: profilesMap.get(book.uploaded_by)
      })) || [];

      setBooks(booksWithProfiles);
    } catch (error: any) {
      toast.error("Failed to load books");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (book: Book) => {
    try {
      const { data, error } = await supabase.storage
        .from('books')
        .download(book.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = book.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Download started");
    } catch (error: any) {
      toast.error("Failed to download book");
    }
  };

  const handleDelete = async (bookId: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this book?")) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('books')
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (dbError) throw dbError;

      toast.success("Book deleted successfully");
      fetchBooks();
    } catch (error: any) {
      toast.error("Failed to delete book");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading books...</div>;
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No books found
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-2xl font-bold">Admin Dashboard - All Books</h3>
        <p className="text-muted-foreground">Manage all uploaded books and view uploader details</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {books.map((book) => (
          <Card key={book.id} className="border border-border">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-20 h-28 bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center font-bold text-slate-700">
                  <span className="text-xs text-center px-1">Book</span>
                </div>
                
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-1">{book.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">by {book.author || "Unknown"}</p>
                  
                  {book.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {book.description}
                    </p>
                  )}
                  
                  <div className="flex gap-4 text-xs text-muted-foreground mb-3">
                    {book.category && <span>Category: {book.category}</span>}
                    {book.isbn && <span>ISBN: {book.isbn}</span>}
                    <span>Size: {formatFileSize(book.file_size)}</span>
                    <span>Uploaded: {new Date(book.upload_date).toLocaleDateString()}</span>
                  </div>
                  
                  {book.uploader_profile && (
                    <div className="bg-[hsl(var(--academic-beige))] border border-border rounded p-3 mb-3">
                      <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Uploader Details
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span>{book.uploader_profile.full_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span>{book.uploader_profile.email}</span>
                        </div>
                        {book.uploader_profile.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span>{book.uploader_profile.phone}</span>
                          </div>
                        )}
                        {book.uploader_profile.institution && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">📚</span>
                            <span>{book.uploader_profile.institution}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(book)}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(book.id, book.file_path)}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminBooksView;
