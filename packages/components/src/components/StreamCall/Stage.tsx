import {
  Participant,
  VideoDimension,
} from '@stream-io/video-client-sfu/dist/src/gen/sfu_models/models';
import { useEffect, useRef } from 'react';
import { Call } from '@stream-io/video-client-sfu';
import { useParticipantStreams } from '../../hooks/useParticipantStreams';
import { useParticipants } from '../../hooks/useParticipants';

export const Stage = (props: { call: Call; participants: Participant[] }) => {
  const { call, participants: initialParticipants } = props;
  const { userAudioStreams, userVideoStreams } = useParticipantStreams(call);
  const participants = useParticipants(call, initialParticipants);
  useEffect(() => {
    const subscriptions = participants.reduce<{
      [key: string]: VideoDimension;
    }>((acc, participant) => {
      const userId = participant.user!.id;
      acc[userId] = {
        width: 640,
        height: 480,
      };
      return acc;
    }, {});

    call.updateSubscriptions(subscriptions).catch((e: Error) => {
      console.error(`Failed to update subscriptions`, e);
    });
  }, [call, participants]);

  const grid = `str-video__grid-${participants.length || 1}`;
  return (
    <div className={`str-video__stage ${grid}`}>
      {participants.map((participant) => {
        const userId = participant.user!.id;
        const audioStream = userAudioStreams[userId];
        const videoStream = userVideoStreams[userId];
        return (
          <ParticipantBox
            key={userId}
            participant={participant}
            audioStream={audioStream}
            videoStream={videoStream}
          />
        );
      })}
    </div>
  );
};

type ParticipantProps = {
  participant: Participant;
  audioStream?: MediaStream;
  videoStream?: MediaStream;
};
const ParticipantBox = (props: ParticipantProps) => {
  const { audioStream, videoStream, participant } = props;
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useAttachMediaStream(audioRef.current, audioStream);
  useAttachMediaStream(videoRef.current, videoStream);

  return (
    <div className="str-video__participant">
      <audio autoPlay ref={audioRef} />
      <video className="str-video__remote-video" autoPlay ref={videoRef} />
      <div className="str-video__participant_details">
        <span className="str-video__participant_name">
          {participant.user?.id}
        </span>
      </div>
    </div>
  );
};

const useAttachMediaStream = (
  $el: HTMLMediaElement | null,
  mediaStream?: MediaStream,
) => {
  useEffect(() => {
    if (!$el) return;
    if (mediaStream) {
      $el.srcObject = mediaStream;
    }
    return () => {
      $el.srcObject = null;
    };
  }, [$el, mediaStream]);
};
