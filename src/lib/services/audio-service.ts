///////////////////////////////////////////////////////////////////////////////
// Singleton audio service to manage shared audio element across the application
///////////////////////////////////////////////////////////////////////////////
class AudioService {
  private static instance: AudioService;
  private audioElement: HTMLAudioElement | null = null;
  private currentPodcastId: string | null = null;

  private constructor() {
    // Private constructor to enforce singleton pattern
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.audioElement.preload = 'auto';
      
      // Add error handler to the audio element
      this.audioElement.addEventListener('error', (e) => {
        const error = e.currentTarget as HTMLAudioElement;
        const mediaError = error.error;
        
        let errorMessage = "Unknown audio error";
        if (mediaError) {
          switch (mediaError.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMessage = "Audio playback was aborted";
              break;
            case MediaError.MEDIA_ERR_NETWORK:
              errorMessage = "Network error occurred while loading audio";
              break;
            case MediaError.MEDIA_ERR_DECODE:
              errorMessage = "Audio decoding failed";
              break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = "Audio format not supported";
              break;
          }
        }
        console.error('Audio error:', { 
          code: mediaError?.code, 
          message: errorMessage 
        });
      });
    }
  } // end of constructor

  ///////////////////////////////////////////////////////////////////////////////
  // Get the singleton instance of the audio service
  ///////////////////////////////////////////////////////////////////////////////
  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Get the audio element
  ///////////////////////////////////////////////////////////////////////////////
  public getAudioRef(): React.RefObject<HTMLAudioElement> {
    return {
      current: this.audioElement
    };
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Load a podcast
  ///////////////////////////////////////////////////////////////////////////////
  public loadPodcast(podcastId: string, audioUrl: string): void {
    if (!this.audioElement) return;

    try {
      // Only update if it's a different podcast
      if (this.currentPodcastId !== podcastId) {
        // Reset the audio element state
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        
        // Update source and load
        this.audioElement.src = audioUrl;
        this.currentPodcastId = podcastId;
        
        // Load the new source
        try {
          this.audioElement.load();
          // Always try to play the new podcast
          this.audioElement.play().catch(error => {
            console.error('Error auto-playing new podcast:', error);
            this.currentPodcastId = null;
          });
        } catch (loadError) {
          console.error('Error loading audio:', loadError);
          this.currentPodcastId = null;
          this.audioElement.src = '';
          return;
        }
      }
    } catch (error) {
      console.error('Error in loadPodcast:', error);
      // Reset state on error
      this.currentPodcastId = null;
      if (this.audioElement) {
        this.audioElement.src = '';
      }
    }
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Get the current podcast id
  ///////////////////////////////////////////////////////////////////////////////
  public getCurrentPodcastId(): string | null {
    return this.currentPodcastId;
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Play the audio element
  ///////////////////////////////////////////////////////////////////////////////
  public play(): Promise<void> {
    if (!this.audioElement) return Promise.reject(new Error('No audio element available'));
    return this.audioElement.play().catch(error => {
      console.error('Error in play:', error);
      throw error;
    });
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Pause the audio element
  ///////////////////////////////////////////////////////////////////////////////
  public pause(): void {
    if (!this.audioElement) return;
    try {
      this.audioElement.pause();
    } catch (error) {
      console.error('Error in pause:', error);
    }
  }
}

export const audioService = AudioService.getInstance(); 