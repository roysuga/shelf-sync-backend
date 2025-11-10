import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Star, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Book {
  id: string;
  title: string;
  author: string;
}

interface Review {
  id: string;
  book_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  books: {
    title: string;
    author: string;
  };
}

const ReviewsView = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  useEffect(() => {
    fetchBooks();
    fetchMyReviews();
  }, []);

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from("books")
        .select("id, title, author")
        .order("title");

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  const fetchMyReviews = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          book_id,
          rating,
          review_text,
          created_at,
          books (title, author)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBook) {
      toast.error("Please select a book");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to submit reviews");
        return;
      }

      const { error } = await supabase.from("reviews").insert({
        book_id: selectedBook,
        user_id: user.id,
        rating,
        review_text: reviewText.trim() || null,
      });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      
      setSelectedBook("");
      setRating(5);
      setReviewText("");
      
      fetchMyReviews();
    } catch (error: any) {
      toast.error(error.message || "Error submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) {
      return;
    }

    setDeletingReviewId(reviewId);

    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;

      toast.success("Review deleted successfully!");
      fetchMyReviews();
    } catch (error: any) {
      toast.error(error.message || "Error deleting review");
    } finally {
      setDeletingReviewId(null);
    }
  };

  const renderStars = (currentRating: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= currentRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            } ${interactive ? "cursor-pointer" : ""}`}
            onClick={() => interactive && setRating(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="border border-border rounded-[10px] p-3.5 bg-white">
        <h5 className="text-lg font-semibold mb-3">Submit a Review</h5>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-muted-foreground text-sm">Select Book</Label>
            <Select value={selectedBook} onValueChange={setSelectedBook}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a book to review" />
              </SelectTrigger>
              <SelectContent>
                {books.map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.title} by {book.author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Rating</Label>
            {renderStars(rating, true)}
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">
              Review (Optional)
            </Label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              placeholder="Share your thoughts about this book..."
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="bg-[hsl(var(--academic-accent))] hover:bg-[hsl(var(--academic-accent))]/90"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </div>

      <div className="border border-border rounded-[10px] p-3.5 bg-white">
        <h5 className="text-lg font-semibold mb-3">My Reviews</h5>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {myReviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              You haven't submitted any reviews yet.
            </p>
          ) : (
            myReviews.map((review) => (
              <div
                key={review.id}
                className="border border-border rounded-md p-3 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">
                      {review.books.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {review.books.author}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteReview(review.id)}
                    disabled={deletingReviewId === review.id}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {renderStars(review.rating)}
                {review.review_text && (
                  <p className="text-sm text-muted-foreground">
                    {review.review_text}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsView;
