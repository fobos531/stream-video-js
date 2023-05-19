import {
  DefaultParticipantViewUI,
  ParticipantView,
  SfuModels,
  useRemoteParticipants,
  Video,
} from '@stream-io/video-react-sdk';
import { useEgressReadyWhenAnyParticipantMounts } from '../egressReady';
import './ScreenShare.scss';
import { AudioTracks } from './AudioTracks';

export const DominantSpeakerScreenShare = () => {
  const participants = useRemoteParticipants();
  const screenSharingParticipant = participants.find((p) =>
    p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE),
  );

  const setParticipantVideoRef = useEgressReadyWhenAnyParticipantMounts(
    screenSharingParticipant!,
    SfuModels.TrackType.SCREEN_SHARE,
  );

  if (!screenSharingParticipant) return <h2>No active screen share</h2>;

  return (
    <>
      <div className="screen-share-container">
        <Video
          className="screen-share-player"
          participant={screenSharingParticipant}
          kind="screen"
          autoPlay
          muted
          setVideoElementRef={setParticipantVideoRef}
        />
        <span>
          Presenter:{' '}
          {screenSharingParticipant.name || screenSharingParticipant.userId}
        </span>
        <div className="current-speaker">
          <ParticipantView
            participant={screenSharingParticipant}
            ParticipantViewUI={
              <DefaultParticipantViewUI
                participant={screenSharingParticipant}
                indicatorsVisible={false}
                showMenuButton={false}
              />
            }
          />
        </div>
      </div>
      <AudioTracks
        participants={participants}
        dominantSpeaker={screenSharingParticipant}
      />
    </>
  );
};
