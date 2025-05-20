
import Image from 'next/image';
import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import type { ErrorData } from 'hls.js';

interface VideoPlayerPlaceholderProps {
  hlsStreamUrl?: string;
  currentSubtitle?: string;
  isPlaying: boolean;
}

export function VideoPlayerPlaceholder({ hlsStreamUrl, currentSubtitle, isPlaying }: VideoPlayerPlaceholderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const isPlayingRef = useRef(isPlaying);

  // Update isPlayingRef whenever isPlaying prop changes
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Effect for HLS/source setup - depends only on hlsStreamUrl
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Event handlers
    const handleManifestParsed = () => {
      if (isPlayingRef.current && videoElement) {
        videoElement.play().catch(error => {
          console.error("HLS.js: Error attempting to play video after manifest parsed:", error);
        });
      }
    };

    const handleNativeMetadataLoaded = () => {
      if (isPlayingRef.current && videoElement) {
        videoElement.play().catch(error => {
          console.error("Native HLS: Error attempting to play video after metadata loaded:", error);
        });
      }
    };
    
    const handleHlsError = (event: string, data: ErrorData) => {
        const hlsInstance = hlsRef.current; // Capture current ref value
        if (!hlsInstance) return;

        if (data.fatal) {
            switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('HLS.js: fatal network error encountered', data);
                hlsInstance.startLoad();
                break;
            case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('HLS.js: fatal media error encountered', data);
                hlsInstance.recoverMediaError();
                break;
            default:
                console.error('HLS.js: fatal error encountered, cannot recover', data);
                hlsInstance.destroy();
                hlsRef.current = null; // Clear the ref as instance is destroyed
                break;
            }
        } else {
            console.warn('HLS.js: non-fatal error encountered', data);
        }
    };

    // Cleanup previous HLS instance or src
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    videoElement.removeAttribute('src');
    // videoElement.load(); // Avoid calling load() directly after src change unless necessary, can cause issues.

    if (hlsStreamUrl) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          // Recommended settings for live streams
          // liveSyncDurationCount: 3, // Number of segments to keep in buffer for live sync
          // liveMaxLatencyDurationCount: 5, // Max latency before seeking to live edge
          // maxMaxBufferLength: 30, // Max buffer length in seconds
        });
        hlsRef.current = hls; // Assign to ref
        hls.on(Hls.Events.MANIFEST_PARSED, handleManifestParsed);
        hls.on(Hls.Events.ERROR, handleHlsError);
        hls.loadSource(hlsStreamUrl);
        hls.attachMedia(videoElement);
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = hlsStreamUrl;
        videoElement.addEventListener('loadedmetadata', handleNativeMetadataLoaded);
        // Consider: videoElement.addEventListener('error', (e) => console.error("Native HLS: Video error:", e));
      } else {
        console.warn("HLS.js is not supported and native HLS playback might not be available.");
        videoElement.src = hlsStreamUrl; // Fallback attempt
      }
    } else {
      // If hlsStreamUrl is cleared, ensure the video element is reset
      videoElement.pause();
      videoElement.removeAttribute('src');
      // videoElement.load(); // This might be desired to clear the last frame
    }

    return () => { // Cleanup function for this effect
      if (hlsRef.current) {
        // Detach listeners before destroying
        hlsRef.current.off(Hls.Events.MANIFEST_PARSED, handleManifestParsed);
        hlsRef.current.off(Hls.Events.ERROR, handleHlsError);
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      videoElement.removeEventListener('loadedmetadata', handleNativeMetadataLoaded);
      // videoElement.removeEventListener('error', ...); // If error listener was added for native
      videoElement.removeAttribute('src');
      // videoElement.load(); // Optional: reset player state on component unmount or URL change
    };
  }, [hlsStreamUrl]); // Only re-run when hlsStreamUrl changes

  // Effect for play/pause commands based on isPlaying prop
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      // Attempt to play only if there's a stream URL configured and video is ready enough
      if (hlsStreamUrl && videoElement.readyState >= videoElement.HAVE_METADATA) {
        if (videoElement.paused) {
          const playPromise = videoElement.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              if (error.name !== 'AbortError') { // AbortError is common if play is interrupted by new load
                console.error("Video Player: Error attempting to play:", error);
              }
            });
          }
        }
      } else if (hlsStreamUrl && videoElement.readyState < videoElement.HAVE_METADATA) {
        // If not ready, the loadedmetadata/manifestparsed handlers will attempt play via isPlayingRef
        // console.log("Video player: play requested, but video not ready. Waiting for load events.");
      }
    } else {
      if (!videoElement.paused) {
        videoElement.pause();
      }
    }
  }, [isPlaying, hlsStreamUrl]); // Also depend on hlsStreamUrl to re-evaluate if it becomes available/unavailable

  const displaySubtitleText = currentSubtitle || (hlsStreamUrl && isPlaying && !currentSubtitle ? "Waiting for subtitles..." : "");

  return (
    <div className="relative aspect-video w-full max-w-4xl mx-auto bg-black rounded-lg shadow-2xl overflow-hidden border-2 border-card">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        controls
        muted
        playsInline
        // autoPlay is managed by useEffects
      />
      {!hlsStreamUrl && (
         <Image
          src="https://placehold.co/1920x1080.png"
          alt="Video stream placeholder"
          fill // Use fill for Next.js v13+ Image
          style={{ objectFit: 'cover' }} // Required with fill
          data-ai-hint="broadcast television"
          priority
        />
      )}
      {hlsStreamUrl && <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-3 py-1 text-sm font-bold rounded-md shadow-md">LIVE</div>}
      
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
