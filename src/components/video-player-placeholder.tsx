
import Image from 'next/image';
import React, { useEffect, useRef } from 'react';

interface VideoPlayerPlaceholderProps {
  hlsStreamUrl?: string;
  currentSubtitle?: string;
  isPlaying: boolean;
}

export function VideoPlayerPlaceholder({ hlsStreamUrl, currentSubtitle, isPlaying }: VideoPlayerPlaceholderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (hlsStreamUrl) {
        videoRef.current.src = hlsStreamUrl;
        videoRef.current.load(); // Load the new source
      } else {
        // If hlsStreamUrl is removed, clear the src attribute
        videoRef.current.removeAttribute('src');
        videoRef.current.load(); // Reset the video element
      }
    }
  }, [hlsStreamUrl]);

  useEffect(() => {
    if (videoRef.current) {
      // Check if src is set and video is ready enough to play to avoid errors
      if (isPlaying && videoRef.current.src && videoRef.current.readyState >= videoRef.current.HAVE_METADATA) { // HAVE_METADATA or higher
        videoRef.current.play().catch(error => {
          // Autoplay restrictions might prevent play, especially if not muted or no user interaction.
          console.error("Error attempting to play video:", error);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, hlsStreamUrl]); // also depend on hlsStreamUrl to re-evaluate play if src changes and isPlaying is true

  // Determine what subtitle text to display
  const displaySubtitleText = currentSubtitle || (hlsStreamUrl && isPlaying && !currentSubtitle ? "Waiting for subtitles..." : "");

  return (
    <div className="relative aspect-video w-full max-w-4xl mx-auto bg-black rounded-lg shadow-2xl overflow-hidden border-2 border-card">
      {hlsStreamUrl ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          controls // Enable default video controls
          muted // Mute by default to help with autoplay policies
          playsInline // Important for iOS and inline playback
          // autoPlay is handled by the useEffect hook based on `isPlaying`
        />
      ) : (
        <Image
          src="https://placehold.co/1920x1080.png"
          alt="Video stream placeholder"
          layout="fill"
          objectFit="cover"
          data-ai-hint="broadcast television"
          priority
        />
      )}
      <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-3 py-1 text-sm font-bold rounded-md shadow-md">LIVE</div>
      
      {displaySubtitleText && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-[15%] p-2 md:p-4 flex items-center justify-center"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0) 100%)' }}
        >
          <p 
            className="text-lg md:text-2xl lg:text-3xl font-semibold text-center text-white"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
          >
            {displaySubtitleText}
          </p>
        </div>
      )}
    </div>
  );
}

    