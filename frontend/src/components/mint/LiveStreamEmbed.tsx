"use client";

interface LiveStreamEmbedProps {
  videoId: string;
}

export function LiveStreamEmbed({ videoId }: LiveStreamEmbedProps) {
  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden shadow-xl">
      {/* 16:9 Aspect Ratio Container */}
      <div className="relative w-full pb-[56.25%]">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`}
          title="Live Stream"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
