import { MemberInput, StreamVideoClient } from '@stream-io/video-client';
import InCallManager from 'react-native-incall-manager';
import { MediaStream } from 'react-native-webrtc';

const joinCall = async (
  videoClient: StreamVideoClient,
  localMediaStream: MediaStream,
  callDetails: {
    autoJoin?: boolean;
    callId: string;
    callType: string;
    ring?: boolean;
    members?: MemberInput[];
  },
) => {
  const { members, ring, callId, callType } = callDetails;
  let call;
  if (members && ring) {
    call = await videoClient.joinCall({
      id: callId,
      type: callType,
      // FIXME: OL this needs to come from somewhere // TODO: SANTHOSH, this is optional, check its purpose
      datacenterId: '',
      input: {
        ring: ring,
        members: members,
      },
    });
  } else {
    call = await videoClient.joinCall({
      id: callId,
      type: callType,
      // FIXME: OL this needs to come from somewhere // TODO: SANTHOSH, this is optional, check its purpose
      datacenterId: '',
    });
  }
  if (!call) {
    throw new Error(`Failed to join a call with id: ${callId}`);
  }
  try {
    InCallManager.start({ media: 'video' });
    InCallManager.setForceSpeakerphoneOn(true);
    await call.join(localMediaStream, localMediaStream);
    await call.publishMediaStreams(localMediaStream, localMediaStream);
    return call;
  } catch (err) {
    console.warn('failed to join call', err);
  }
};

export { joinCall };
