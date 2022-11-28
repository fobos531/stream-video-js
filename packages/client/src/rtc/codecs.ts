import * as SDPTransform from 'sdp-transform';
import type { Codec } from '../gen/video/sfu/models/models';

export const getPreferredCodecs = (
  kind: 'audio' | 'video',
  videoCodec: string,
) => {
  if (!('getCapabilities' in RTCRtpSender)) {
    console.warn('RTCRtpSender.getCapabilities is not supported');
    return;
  }
  const cap = RTCRtpSender.getCapabilities(kind);
  console.log('s4e');
  if (!cap) return;
  const matched: RTCRtpCodecCapability[] = [];
  const partialMatched: RTCRtpCodecCapability[] = [];
  const unmatched: RTCRtpCodecCapability[] = [];
  cap.codecs.forEach((c) => {
    const codec = c.mimeType.toLowerCase();
    if (codec === 'audio/opus') {
      matched.push(c);
      return;
    }
    console.log(c);
    const matchesVideoCodec = codec === `video/${videoCodec}`;
    if (!matchesVideoCodec) {
      unmatched.push(c);
      return;
    }
    // for h264 codecs that have sdpFmtpLine available, use only if the
    // profile-level-id is 42e01f for cross-browser compatibility
    if (videoCodec === 'h264') {
      if (c.sdpFmtpLine && c.sdpFmtpLine.includes('profile-level-id=42e01f')) {
        matched.push(c);
      } else {
        partialMatched.push(c);
      }
      return;
    }
    console.log('matched', matched);
    matched.push(c);
  });

  return [
    ...matched,
    ...partialMatched,
    ...unmatched,
  ] as RTCRtpCodecCapability[];
};

export const getReceiverCodecs = async (
  kind: 'audio' | 'video',
  pc?: RTCPeerConnection,
) => {
  return getCodecsFromPeerConnection(pc, kind, 'recvonly');
};

const getCodecsFromPeerConnection = async (
  pc: RTCPeerConnection | undefined,
  kind: 'audio' | 'video',
  direction: RTCRtpTransceiverDirection,
) => {
  let sdp =
    direction === 'sendonly'
      ? pc?.localDescription?.sdp
      : direction === 'recvonly'
      ? pc?.remoteDescription?.sdp
      : null;

  if (!sdp) {
    const tempPc = new RTCPeerConnection();
    const transceiver = tempPc.addTransceiver(kind);
    transceiver.direction = direction;

    const offer = await tempPc.createOffer();
    sdp = offer.sdp;
    tempPc.close();
  }

  const parsedSdp = SDPTransform.parse(sdp || '');
  const supportedCodecs: Codec[] = [];
  parsedSdp.media.forEach((media) => {
    if (media.type === kind) {
      media.rtp.forEach((rtp) => {
        const fmtpLine = media.fmtp.find((f) => f.payload === rtp.payload);
        const feedback = media.rtcpFb
          ?.filter((f) => f.payload === rtp.payload)
          .map((f) => f.type);
        supportedCodecs.push({
          payloadType: rtp.payload,
          name: rtp.codec,
          fmtpLine: fmtpLine?.config ?? '',
          clockRate: rtp.rate ?? 0,
          encodingParameters: String(rtp.encoding || ''),
          feedback: feedback || [],
        });
      });
    }
  });

  return supportedCodecs;
};
