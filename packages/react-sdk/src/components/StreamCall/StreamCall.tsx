import { ReactNode, useEffect } from 'react';

import {
  useAcceptedCall,
  useActiveCall,
  useOutgoingCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { MediaDevicesProvider } from '../../contexts';

export const StreamCall = ({ children }: { children: ReactNode }) => {
  const videoClient = useStreamVideoClient();
  const [outgoingCall] = useOutgoingCalls();
  const acceptedCall = useAcceptedCall();
  const activeCall = useActiveCall();

  useEffect(() => {
    if (!videoClient || activeCall) return;

    if (outgoingCall.call && videoClient.callConfig.joinCallInstantly) {
      videoClient.joinCall(outgoingCall.call!.id, outgoingCall.call!.type);
    } else if (
      acceptedCall?.call &&
      !videoClient.callConfig.joinCallInstantly
    ) {
      videoClient.joinCall(outgoingCall.call!.id, outgoingCall.call!.type);
    }
  }, [videoClient, outgoingCall, acceptedCall, activeCall]);

  if (!videoClient) return null;

  return <MediaDevicesProvider>{children}</MediaDevicesProvider>;
};
