import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MediaStream, RTCView } from 'react-native-webrtc';
import {
  SfuModels,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { useActiveCall } from '@stream-io/video-react-bindings';
import { VideoRenderer } from './VideoRenderer';
import { Avatar } from './Avatar';
import { useStreamVideoStoreValue } from '../contexts';
import { MicOff, ScreenShare, VideoSlash } from '../icons';
import { theme } from '../theme';
import { palette } from '../theme/constants';
/**
 * Props to be passed for the ParticipantView component.
 */
interface ParticipantViewProps {
  /**
   * The participant that will be displayed
   */
  participant: StreamVideoParticipant | StreamVideoLocalParticipant;
  /**
   * The video kind that will be displayed
   */
  kind: 'video' | 'screen';
  /**
   * Any custom style to be merged with the participant view
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Any custom style to be merged with the VideoRenderer
   */
  videoRendererStyle?: StyleProp<ViewStyle>;
  /**
   * When set to true, the video stream will not be shown even if it is available.
   */
  disableVideo?: boolean;
}

/**
 * Renders either the participants' video track or screenShare track
 * and additional info, by an absence of a video track only an
 * avatar and audio track will be rendered.
 *
 * | When Video is Enabled | When Video is Disabled |
 * | :--- | :----: |
 * |![participant-view-1](https://user-images.githubusercontent.com/25864161/217489213-d4532ca1-49ee-4ef5-940c-af2e55bc0a5f.png)|![participant-view-2](https://user-images.githubusercontent.com/25864161/217489207-fb20c124-8bce-4c2b-87f9-4fe67bc50438.png)|
 */
export const ParticipantView = (props: ParticipantViewProps) => {
  const { participant, kind, disableVideo } = props;
  const call = useActiveCall();

  const isCameraOnFrontFacingMode = useStreamVideoStoreValue(
    (store) => store.isCameraOnFrontFacingMode,
  );

  const onLayout: React.ComponentProps<typeof View>['onLayout'] = (event) => {
    if (!call) {
      return;
    }
    const { height, width } = event.nativeEvent.layout;
    call.updateSubscriptionsPartial(kind, {
      [participant.sessionId]: {
        dimension: {
          width: Math.trunc(width),
          height: Math.trunc(height),
        },
      },
    });
  };

  const { isSpeaking, isLoggedInUser, publishedTracks } = participant;

  // NOTE: We have to cast to MediaStream type from webrtc
  // as JS client sends the web navigators' mediastream type instead
  const videoStream = (
    kind === 'video' ? participant.videoStream : participant.screenShareStream
  ) as MediaStream | undefined;

  const audioStream = participant.audioStream as MediaStream | undefined;
  const isAudioMuted = !publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const isVideoMuted = !publishedTracks.includes(SfuModels.TrackType.VIDEO);
  const isScreenSharing = kind === 'screen';
  const mirror = isLoggedInUser && isCameraOnFrontFacingMode;
  const isAudioAvailable = useMemo(
    () => kind === 'video' && !!audioStream && !isAudioMuted,
    [kind, audioStream, isAudioMuted],
  );
  const isVideoAvailable = useMemo(
    () => !!videoStream && !isVideoMuted,
    [videoStream, isVideoMuted],
  );
  const applySpeakerStyle = isSpeaking && !isScreenSharing;
  const speakerStyle = applySpeakerStyle && styles.isSpeaking;
  const videoOnlyStyle = !isScreenSharing && {
    borderColor: palette.grey800,
    borderWidth: 2,
  };

  const participantLabel =
    participant.userId.length > 15
      ? `${participant.userId.slice(0, 15)}...`
      : participant.userId;

  return (
    <View
      style={[
        styles.containerBase,
        videoOnlyStyle,
        props.containerStyle,
        speakerStyle,
      ]}
      onLayout={onLayout}
    >
      {isVideoAvailable && !disableVideo ? (
        <VideoRenderer
          zOrder={1}
          mirror={mirror}
          mediaStream={videoStream as MediaStream}
          objectFit={kind === 'screen' ? 'contain' : 'cover'}
          style={[styles.videoRenderer, props.videoRendererStyle]}
        />
      ) : (
        <Avatar participant={participant} />
      )}
      {isAudioAvailable && (
        <RTCView streamURL={(audioStream as MediaStream).toURL()} />
      )}
      {kind === 'video' && (
        <View style={styles.status}>
          <Text style={styles.userNameLabel}>{participantLabel}</Text>
          <View style={styles.svgContainerStyle}>
            {isAudioMuted && <MicOff color={theme.light.error} />}
          </View>
          <View style={styles.svgContainerStyle}>
            {isVideoMuted && <VideoSlash color={theme.light.error} />}
          </View>
        </View>
      )}
      {kind === 'screen' && (
        <View style={styles.screenViewStatus}>
          <View style={[{ marginRight: theme.margin.sm }, theme.icon.md]}>
            <ScreenShare color={theme.light.static_white} />
          </View>
          <Text style={styles.userNameLabel}>
            {participant.userId} is sharing their screen
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  containerBase: {
    justifyContent: 'center',
  },
  videoRenderer: {
    flex: 1,
    justifyContent: 'center',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: theme.spacing.sm,
    bottom: theme.spacing.sm,
    padding: theme.padding.sm,
    borderRadius: theme.rounded.xs,
    backgroundColor: theme.light.static_overlay,
  },
  screenViewStatus: {
    position: 'absolute',
    top: theme.spacing.md,
    padding: theme.padding.sm,
    borderRadius: theme.rounded.xs,
    backgroundColor: theme.light.static_overlay,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userNameLabel: {
    color: theme.light.static_white,
    ...theme.fonts.caption,
  },
  svgContainerStyle: {
    marginLeft: theme.margin.xs,
    ...(theme.icon.xs as object),
  },
  isSpeaking: {
    borderColor: theme.light.primary,
    borderWidth: 2,
  },
});
