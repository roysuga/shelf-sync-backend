const HeroSection = () => {
  return (
    <div className="bg-gradient-to-b from-white to-[#fbfbfb] border border-border rounded-[10px] p-8 flex gap-6 items-center justify-between flex-wrap md:flex-nowrap mb-6">
      <div className="flex-1 min-w-[260px] max-w-full md:max-w-[calc(100%-360px)]">
        <h2 className="mt-0 mb-2 font-bold text-2xl">TextAssess</h2>
        <p className="text-muted-foreground text-[0.95rem] mb-3.5">
          A place where educators and students share honest textbook reviews. Use TextAssess to discover high-quality textbooks recommended by professors,
          industry experts and fellow students.
        </p>

        <div className="mb-3.5">
          <strong>What you can do</strong>
          <ul className="text-muted-foreground text-[0.9rem] mt-1.5 pl-4.5">
            <li>Find textbooks by title, author or topic.</li>
            <li>Read verified reviews from educators and students.</li>
            <li>Submit a textbook or write a review (requires account).</li>
          </ul>
        </div>

        <div className="text-muted-foreground text-[0.9rem]">
          To browse books, view profiles (your dashboard), or access features you must be signed in. Click <strong>Login</strong> (top-right) to continue.
        </div>
      </div>

      <aside className="flex-none w-full md:w-[320px] min-w-[220px] flex flex-col gap-4.5 items-end" aria-hidden="true">
        <div className="flex flex-col gap-3.5 items-center justify-center w-full mb-2">
          <img 
            src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80" 
            alt="bookshelf"
            className="w-full md:w-[320px] h-[120px] object-cover rounded-lg shadow-md"
          />
          <img 
            src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80" 
            alt="library curve"
            className="w-full md:w-[320px] h-[120px] object-cover rounded-lg shadow-md"
          />
          <img 
            src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80" 
            alt="stack of books"
            className="w-full md:w-[320px] h-[120px] object-cover rounded-lg shadow-md"
          />
        </div>
      </aside>
    </div>
  );
};

export default HeroSection;