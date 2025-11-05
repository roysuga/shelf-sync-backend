import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface BooksViewProps {
  refreshTrigger: number;
}

const BooksView = ({ refreshTrigger }: BooksViewProps) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");

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
      const { error: storageError } = await supabase.storage
        .from('books')
        .remove([book.file_path]);

      if (storageError) throw storageError;

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

  const filteredBooks = books.filter(book => 
    filterText === "" || 
    book.title.toLowerCase().includes(filterText.toLowerCase()) ||
    (book.author && book.author.toLowerCase().includes(filterText.toLowerCase()))
  );

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading books...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-lg mb-1">Books</h3>
          <div className="text-sm text-muted-foreground">Filter and browse the entire catalogue</div>
        </div>
        <div className="flex gap-2">
          <Input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter by author or title"
            className="w-64"
          />
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="border border-border rounded-lg p-8 bg-white">
          <div className="flex flex-col items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filterText ? "No books found matching your filter" : "No books uploaded yet"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredBooks.map((book) => (
            <div key={book.id} className="border border-border rounded-lg p-3 bg-white flex gap-3 items-start hover:shadow-md transition-shadow">
              <div className="w-[84px] h-[112px] rounded-md bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center font-bold text-[#1e293b] text-xs text-center p-2 flex-shrink-0">
                {book.title.substring(0, 20)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1 line-clamp-2">{book.title}</h4>
                {book.author && (
                  <p className="text-xs text-muted-foreground mb-2">by {book.author}</p>
                )}
                
                {book.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {book.description}
                  </p>
                )}
                
                <div className="text-xs text-muted-foreground space-y-0.5 mb-2">
                  {book.category && <div>Category: {book.category}</div>}
                  <div>Size: {formatFileSize(book.file_size)}</div>
                  <div>
                    {formatDistanceToNow(new Date(book.upload_date), { addSuffix: true })}
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <Button
                    onClick={() => handleDownload(book)}
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-xs h-8"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  
                  {currentUserId === book.uploaded_by && (
                    <Button
                      onClick={() => handleDelete(book)}
                      variant="destructive"
                      size="sm"
                      className="h-8 px-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BooksView;