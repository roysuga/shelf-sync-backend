import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReviewsView from "@/components/ReviewsView";

interface SubmitViewProps {
  onUploadComplete: () => void;
}

const SubmitView = ({ onUploadComplete }: SubmitViewProps) => {
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [edition, setEdition] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isbn, setIsbn] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !title || !author) {
      toast.error("Please provide title, author and file");
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to submit books");
        return;
      }

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('books')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Insert book metadata into database
      const { error: dbError } = await supabase
        .from('books')
        .insert({
          title,
          author,
          description: `${description}${edition ? ` (Edition: ${edition})` : ''}`,
          category,
          isbn,
          file_name: file.name,
          file_path: data.path,
          file_size: file.size,
          uploaded_by: user.id,
        });

      if (dbError) throw dbError;

      toast.success("Book submitted successfully!");
      
      // Reset form
      setTitle("");
      setAuthor("");
      setEdition("");
      setDescription("");
      setCategory("");
      setIsbn("");
      setFile(null);
      
      const form = document.getElementById('bookSubmitForm') as HTMLFormElement;
      if (form) form.reset();
      
      onUploadComplete();
    } catch (error: any) {
      toast.error(error.message || "Error submitting book");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Tabs defaultValue="submit" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="submit">Submit Book</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
      </TabsList>

      <TabsContent value="submit">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="border border-border rounded-[10px] p-3.5 bg-white">
        <h5 className="text-lg font-semibold mb-3">Submit a textbook</h5>
        <form id="bookSubmitForm" onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-muted-foreground text-sm">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Author</Label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
            />
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Edition / Year</Label>
            <Input
              value={edition}
              onChange={(e) => setEdition(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Category</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Mathematics, Science"
            />
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">ISBN (optional)</Label>
            <Input
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Upload book document (PDF / DOC / DOCX / TXT)</Label>
            <Input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.epub,.mobi"
              required
            />
            <div className="text-muted-foreground text-xs mt-1">
              Supported formats: PDF, DOC, DOCX, TXT, EPUB, MOBI
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Short description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={uploading}
              className="bg-[hsl(var(--academic-accent))] hover:bg-[hsl(var(--academic-accent))]/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Submitting..." : "Submit book"}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                const form = document.getElementById('bookSubmitForm') as HTMLFormElement;
                if (form) form.reset();
                setTitle("");
                setAuthor("");
                setEdition("");
                setDescription("");
                setCategory("");
                setIsbn("");
                setFile(null);
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </div>

      <div className="border border-border rounded-[10px] p-3.5 bg-white">
        <h5 className="text-lg font-semibold mb-3">Tips for submitting</h5>
        <div className="text-muted-foreground text-sm space-y-2">
          <p>• Make sure your book file is properly formatted and readable</p>
          <p>• Include accurate metadata (title, author, edition)</p>
          <p>• Add relevant categories to help others find your book</p>
          <p>• Provide a clear description of the book's content</p>
          <p>• Only upload books you have permission to share</p>
        </div>
      </div>
    </div>
      </TabsContent>

      <TabsContent value="reviews">
        <ReviewsView />
      </TabsContent>
    </Tabs>
  );
};

export default SubmitView;