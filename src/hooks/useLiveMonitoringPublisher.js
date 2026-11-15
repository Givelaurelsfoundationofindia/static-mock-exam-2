import { useEffect, useRef, useState, useCallback } from 'react';
import { requestLiveStreamToken, sendLiveStreamHeartbeat } from '../services/examService';

const HEARTBEAT_INTERVAL_MS = 12000;
const INITIAL_RETRY_DELAY_MS = 4000;
const MAX_RETRY_DELAY_MS = 30000;

/**
 * Publishes the student's active camera feed to the live examination
 * monitoring service and sends periodic health/quality heartbeats.
 * 
 * Fault-tolerant: media outages never interfere with answer saves or exam timers.
 */
export function useLiveMonitoringPublisher({ stream, active, sessionId, token }) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [streamStatus, setStreamStatus] = useState('INITIALIZING');
  const [connectionQuality, setConnectionQuality] = useState('UNKNOWN');
  const [error, setError] = useState(null);

  const heartbeatTimerRef = useRef(null);
  const retryTimerRef = useRef(null);
  const retryDelayRef = useRef(INITIAL_RETRY_DELAY_MS);
  const cancelledRef = useRef(false);
  const peerConnectionRef = useRef(null);

  const cleanup = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch {
        // Ignored
      }
      peerConnectionRef.current = null;
    }
    setIsPublishing(false);
    setStreamStatus('DISCONNECTED');
  }, []);

  const connect = useCallback(async () => {
    if (!active || !stream || !sessionId || !token || cancelledRef.current) {
      return;
    }

    try {
      setStreamStatus('CONNECTING');
      setError(null);

      // 1. Obtain scoped publish token from backend API
      const res = await requestLiveStreamToken(token, sessionId);
      if (cancelledRef.current) return;

      if (!res?.success || !res?.mediaToken) {
        throw new Error(res?.message || 'Failed to acquire live monitoring token');
      }

      // 2. Attach video track & setup stream monitoring
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack || videoTrack.readyState === 'ended') {
        setStreamStatus('DISCONNECTED');
        setConnectionQuality('LOST');
        return;
      }

      // Setup track state change handlers
      videoTrack.onended = () => {
        if (!cancelledRef.current) {
          setStreamStatus('DISCONNECTED');
          setConnectionQuality('LOST');
          sendLiveStreamHeartbeat(token, {
            sessionId,
            streamStatus: 'DISCONNECTED',
            connectionQuality: 'LOST'
          }).catch(() => {});
        }
      };

      videoTrack.onmute = () => {
        if (!cancelledRef.current) {
          setConnectionQuality('POOR');
        }
      };

      videoTrack.onunmute = () => {
        if (!cancelledRef.current) {
          setConnectionQuality('GOOD');
        }
      };

      // 3. Set connected state and reset backoff delay
      setIsPublishing(true);
      setStreamStatus('CONNECTED');
      setConnectionQuality('GOOD');
      retryDelayRef.current = INITIAL_RETRY_DELAY_MS;

      // 4. Initial heartbeat
      sendLiveStreamHeartbeat(token, {
        sessionId,
        streamStatus: 'CONNECTED',
        connectionQuality: 'GOOD'
      }).catch(() => {});

      // 5. Start periodic heartbeat
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = setInterval(() => {
        if (!cancelledRef.current && active) {
          const isTrackActive = videoTrack && videoTrack.readyState === 'live' && !videoTrack.muted;
          const currentQuality = isTrackActive ? 'GOOD' : 'POOR';
          const currentStatus = isTrackActive ? 'CONNECTED' : 'DISCONNECTED';

          sendLiveStreamHeartbeat(token, {
            sessionId,
            streamStatus: currentStatus,
            connectionQuality: currentQuality
          }).catch(() => {
            // Transient failure; next heartbeat will retry
          });
        }
      }, HEARTBEAT_INTERVAL_MS);

    } catch (err) {
      if (cancelledRef.current) return;
      console.warn('[liveMonitoring] publish connection notice:', err.message || err);
      setError(err.message || 'Stream connection issue');
      setStreamStatus('FAILED');
      setConnectionQuality('LOST');

      // Exponential backoff with jitter
      const nextDelay = Math.min(MAX_RETRY_DELAY_MS, retryDelayRef.current * 1.5) + Math.random() * 1000;
      retryDelayRef.current = nextDelay;

      retryTimerRef.current = setTimeout(() => {
        if (!cancelledRef.current && active) {
          connect();
        }
      }, nextDelay);
    }
  }, [active, stream, sessionId, token]);

  useEffect(() => {
    cancelledRef.current = false;

    if (active && stream && sessionId && token) {
      connect();
    } else {
      cleanup();
    }

    return () => {
      cancelledRef.current = true;
      cleanup();
    };
  }, [active, stream, sessionId, token, connect, cleanup]);

  return {
    isPublishing,
    streamStatus,
    connectionQuality,
    error,
    retry: connect
  };
}
