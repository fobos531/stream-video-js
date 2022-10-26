import { useEffect, useMemo, useState } from 'react';
import { Call } from '@stream-io/video-client';

export type UserStreamMap = {
  [userId: string]: MediaStream | undefined;
};

export const useParticipantStreams = (call: Call) => {
  const [userAudioStreams, setUserAudioStreams] = useState<UserStreamMap>({});
  const [userVideoStreams, setUserVideoStreams] = useState<UserStreamMap>({});
  useEffect(() => {
    // FIXME: OL: rework this!
    call.handleOnTrack = (e: RTCTrackEvent) => {
      e.track.addEventListener('mute', () => {
        console.log(`Track muted`, e.track.id, e.track);
      });

      e.track.addEventListener('unmute', () => {
        console.log(`Track unmuted`, e.track.id, e.track);
      });

      e.track.addEventListener('ended', () => {
        console.log(`Track ended`, e.track.id, e.track);
      });

      const [primaryStream] = e.streams;
      console.log(primaryStream, e.track);
      // format: <trackId:streamId:kind:random>
      const [trackId] = primaryStream.id.split(':');
      const userId = call.participantMapping[trackId];
      if (!userId) {
        console.warn(`Can't determine userId for trackId`, trackId);
      }
      if (e.track.kind === 'video') {
        setUserVideoStreams((s) => ({
          ...s,
          [userId]: primaryStream,
        }));
      } else if (e.track.kind === 'audio') {
        setUserAudioStreams((s) => ({
          ...s,
          [userId]: primaryStream,
        }));
      }
    };
    return () => {
      call.handleOnTrack = undefined;
    };
  }, [call]);

  useEffect(() => {
    return call.on('participantLeft', (e) => {
      if (e.eventPayload.oneofKind !== 'participantLeft') return;
      const { participant } = e.eventPayload.participantLeft;
      if (participant) {
        const userId = participant.user!.id;
        setUserVideoStreams((s) => ({
          ...s,
          [userId]: undefined,
        }));
        setUserAudioStreams((s) => ({
          ...s,
          [userId]: undefined,
        }));
      }
    });
  }, [call]);

  return useMemo(
    () => ({ userAudioStreams, userVideoStreams }),
    [userAudioStreams, userVideoStreams],
  );
};
