const FloatingShapes = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Purple blob */}
      <div
        className="absolute w-72 h-72 rounded-full opacity-30 blur-3xl animate-blob-float"
        style={{
          background: "hsl(265 89% 62%)",
          top: "10%",
          left: "10%",
        }}
      />
      {/* Blue blob */}
      <div
        className="absolute w-96 h-96 rounded-full opacity-25 blur-3xl animate-blob-float"
        style={{
          background: "hsl(220 90% 56%)",
          top: "40%",
          right: "5%",
          animationDelay: "2s",
        }}
      />
      {/* Pink blob */}
      <div
        className="absolute w-64 h-64 rounded-full opacity-25 blur-3xl animate-blob-float"
        style={{
          background: "hsl(330 85% 60%)",
          bottom: "10%",
          left: "30%",
          animationDelay: "4s",
        }}
      />
      {/* Floating geometric shapes */}
      <div
        className="absolute w-4 h-4 border-2 border-primary/30 rotate-45 animate-float"
        style={{ top: "20%", left: "80%", animationDelay: "1s" }}
      />
      <div
        className="absolute w-3 h-3 bg-accent/20 rounded-full animate-float"
        style={{ top: "60%", left: "15%", animationDelay: "3s" }}
      />
      <div
        className="absolute w-6 h-6 border border-secondary/20 rounded-full animate-float"
        style={{ top: "75%", right: "20%", animationDelay: "0.5s" }}
      />
      <div
        className="absolute w-2 h-2 bg-primary/30 rotate-45 animate-float"
        style={{ top: "30%", left: "50%", animationDelay: "2.5s" }}
      />
      <div
        className="absolute w-5 h-5 border border-accent/20 animate-spin-slow"
        style={{ top: "50%", right: "35%", clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
      />
    </div>
  );
};

export default FloatingShapes;
