
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
  console.log("[VideoPlayerPlaceholder] Props received:", { hlsStreamUrl, isPlaying }); // DIAGNOSTIC LOG
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

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
        const hlsInstance = hlsRef.current;
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
                hlsRef.current = null;
                break;
            }
        } else {
            console.warn('HLS.js: non-fatal error encountered', data);
        }
    };

    if (hlsRef.current) {
      hlsRef.current.off(Hls.Events.MANIFEST_PARSED, handleManifestParsed);
      hlsRef.current.off(Hls.Events.ERROR, handleHlsError);
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    videoElement.removeEventListener('loadedmetadata', handleNativeMetadataLoaded);
    videoElement.removeAttribute('src');
    // videoElement.load(); // Avoid if not strictly necessary

    if (hlsStreamUrl) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          // liveSyncDurationCount: 3,
          // liveMaxLatencyDurationCount: 5,
          // maxMaxBufferLength: 30,
        });
        hlsRef.current = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, handleManifestParsed);
        hls.on(Hls.Events.ERROR, handleHlsError);
        hls.loadSource(hlsStreamUrl);
        hls.attachMedia(videoElement);
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = hlsStreamUrl;
        videoElement.addEventListener('loadedmetadata', handleNativeMetadataLoaded);
      } else {
        console.warn("HLS.js is not supported and native HLS playback might not be available.");
        videoElement.src = hlsStreamUrl;
      }
    } else {
      videoElement.pause();
      videoElement.removeAttribute('src');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.off(Hls.Events.MANIFEST_PARSED, handleManifestParsed);
        hlsRef.current.off(Hls.Events.ERROR, handleHlsError);
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      videoElement.removeEventListener('loadedmetadata', handleNativeMetadataLoaded);
      videoElement.removeAttribute('src');
    };
  }, [hlsStreamUrl]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !hlsStreamUrl) { 
        if(videoElement && !hlsStreamUrl && !videoElement.paused) videoElement.pause();
        return;
    }

    if (isPlaying) {
      // MANIFEST_PARSED or loadedmetadata handles initial play via isPlayingRef.current.
      // This effect handles subsequent play requests if video is ready and paused.
      if (videoElement.paused && videoElement.readyState >= videoElement.HAVE_ENOUGH_DATA) { // Use HAVE_ENOUGH_DATA
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (error.name !== 'AbortError') {
              console.error("Video Player: Error attempting to play in isPlaying effect:", error);
            }
          });
        }
      }
    } else {
      if (!videoElement.paused) {
        videoElement.pause();
      }
    }
  }, [isPlaying, hlsStreamUrl]);

  const displaySubtitleText = currentSubtitle || (hlsStreamUrl && isPlaying && !currentSubtitle ? "Waiting for subtitles..." : "");

  return (
    <div className="relative aspect-video w-full max-w-4xl mx-auto bg-black rounded-lg shadow-2xl overflow-hidden border-2 border-card">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        controls
        muted
        playsInline
      />
      {!hlsStreamUrl && (
         <Image
          src="https://placehold.co/1920x1080.png"
          alt="Video stream placeholder"
          fill
          style={{ objectFit: 'cover' }}
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

    