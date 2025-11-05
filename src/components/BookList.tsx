import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Trash2, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Book {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  category: string | null;
  isbn: string | null;
  file_name: string;
  file_path: string;
  file_size: number | null;
  upload_date: string;
  uploaded_by: string | null;
}

interface BookListProps {
  refreshTrigger: number;
}

const BookList = ({ refreshTrigger }: BookListProps) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchBooks();
    getCurrentUser();
  }, [refreshTrigger]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error: any) {
      toast.error("Error fetching books");
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

      toast.success("Download started!");
    } catch (error: any) {
      toast.error("Error downloading book");
    }
  };

  const handleDelete = async (book: Book) => {
    if (!confirm(`Are you sure you want to delete "${book.title}"?`)) {
      return;
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('books')
        .remove([book.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('books')
        .delete()
        .eq('id', book.id);

      if (dbError) throw dbError;

      toast.success("Book deleted successfully");
      fetchBooks();
    } catch (error: any) {
      toast.error("Error deleting book");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading books...</div>;
  }

  if (books.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No books uploaded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {books.map((book) => (
        <Card key={book.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="line-clamp-2">{book.title}</CardTitle>
            {book.author && (
              <CardDescription>by {book.author}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {book.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {book.description}
              </p>
            )}
            
            <div className="text-xs text-muted-foreground space-y-1">
              {book.category && <div>Category: {book.category}</div>}
              {book.isbn && <div>ISBN: {book.isbn}</div>}
              <div>Size: {formatFileSize(book.file_size)}</div>
              <div>
                Uploaded {formatDistanceToNow(new Date(book.upload_date), { addSuffix: true })}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => handleDownload(book)}
                variant="secondary"
                size="sm"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              
              {currentUserId === book.uploaded_by && (
                <Button
                  onClick={() => handleDelete(book)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BookList;