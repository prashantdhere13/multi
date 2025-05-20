
import Image from 'next/image';
import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerPlaceholderProps {
  hlsStreamUrl?: string;
  currentSubtitle?: string;
  isPlaying: boolean;
}

export function VideoPlayerPlaceholder({ hlsStreamUrl, currentSubtitle, isPlaying }: VideoPlayerPlaceholderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      // Clean up previous HLS instance if it exists
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (hlsStreamUrl) {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hlsRef.current = hls;
          hls.loadSource(hlsStreamUrl);
          hls.attachMedia(videoRef.current);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (isPlaying && videoRef.current) {
              videoRef.current.play().catch(error => {
                console.error("HLS.js: Error attempting to play video after manifest parsed:", error);
              });
            }
          });
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error('HLS.js: fatal network error encountered', data);
                  // Try to recover network error
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error('HLS.js: fatal media error encountered', data);
                  hls.recoverMediaError();
                  break;
                default:
                  // Cannot recover
                  console.error('HLS.js: fatal error encountered, cannot recover', data);
                  hls.destroy();
                  hlsRef.current = null;
                  break;
              }
            } else {
                console.warn('HLS.js: non-fatal error encountered', data);
            }
          });
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (e.g., Safari)
          videoRef.current.src = hlsStreamUrl;
          videoRef.current.addEventListener('loadedmetadata', () => {
             if (isPlaying && videoRef.current) {
                videoRef.current.play().catch(error => {
                    console.error("Native HLS: Error attempting to play video after metadata loaded:", error);
                });
             }
          });
        } else {
            console.warn("HLS.js is not supported and native HLS playback might not be available.");
            // Fallback for browsers that might support HLS without explicit check (less likely)
            videoRef.current.src = hlsStreamUrl;
        }
      } else {
        // If hlsStreamUrl is removed, clear the src attribute and destroy HLS instance
        videoRef.current.removeAttribute('src');
        videoRef.current.load(); // Reset the video element
      }
    }

    // Cleanup function
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoRef.current) {
        // Remove specific event listeners if added directly for native HLS
        // Example: videoRef.current.removeEventListener('loadedmetadata', ...);
      }
    };
  }, [hlsStreamUrl]); //isPlaying is intentionally not here, playback is controlled by the next useEffect

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        // Check if src/HLS is set and video is ready enough to play
        // For HLS.js, it often handles readiness internally before MANIFEST_PARSED
        // For native, readyState check might be more relevant
        if (videoRef.current.src || hlsRef.current) {
            // For native HLS, ensure metadata is loaded for play to succeed without errors
            if (!hlsRef.current && videoRef.current.readyState < videoRef.current.HAVE_METADATA) {
                // Wait for metadata or trust HLS.js to handle it
            } else {
                 videoRef.current.play().catch(error => {
                    console.error("Video Player: Error attempting to play video:", error);
                 });
            }
        }
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, hlsStreamUrl]); // Re-evaluate play if HLS URL changes and isPlaying is true

  const displaySubtitleText = currentSubtitle || (hlsStreamUrl && isPlaying && !currentSubtitle ? "Waiting for subtitles..." : "");

  return (
    <div className="relative aspect-video w-full max-w-4xl mx-auto bg-black rounded-lg shadow-2xl overflow-hidden border-2 border-card">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        controls // Enable default video controls
        muted // Mute by default to help with autoplay policies
        playsInline // Important for iOS and inline playback
        // autoPlay is handled by the useEffect hooks
      />
      {!hlsStreamUrl && (
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
