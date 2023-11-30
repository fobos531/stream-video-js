import './style.css';
import { StreamVideoClient, User } from '@stream-io/video-client';
import { decode } from 'js-base64';
import { cleanupParticipant, renderParticipant } from './participant';
import { renderControls } from './controls';
import {
  renderAudioDeviceSelector,
  renderAudioOutputSelector,
  renderVideoDeviceSelector,
  renderVolumeControl,
} from './device-selector';
import { isMobile } from './mobile';

// import '@tensorflow/tfjs-backend-webgl';
import * as mpSelfieSegmentation from '@mediapipe/selfie_segmentation';
// import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
// import * as tf from '@tensorflow/tfjs-core';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';

// tfjsWasm.setWasmPaths(
//   `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${tfjsWasm.version_wasm}/dist/`,
// );

const searchParams = new URLSearchParams(window.location.search);
const extractPayloadFromToken = (token: string) => {
  const [, payload] = token.split('.');

  if (!payload) throw new Error('Malformed token, missing payload');

  return (JSON.parse(decode(payload)) ?? {}) as Record<string, unknown>;
};

const apiKey = import.meta.env.VITE_STREAM_API_KEY;
const token = searchParams.get('ut') ?? import.meta.env.VITE_STREAM_USER_TOKEN;
const user: User = {
  id: extractPayloadFromToken(token)['user_id'] as string,
};

const callId =
  searchParams.get('call_id') ||
  import.meta.env.VITE_STREAM_CALL_ID ||
  (new Date().getTime() + Math.round(Math.random() * 100)).toString();

const client = new StreamVideoClient({
  apiKey,
  token,
  user,
  options: { logLevel: import.meta.env.VITE_STREAM_LOG_LEVEL },
});
const call = client.call('default', callId);

// @ts-ignore
window.call = call;
// @ts-ignore
window.client = client;

call.camera.setDefaultConstraints({
  width: 640,
  height: 480,
});

call.camera.selectTargetResolution({
  width: 640,
  height: 480,
});

call.screenShare.enableScreenShareAudio();
call.screenShare.setSettings({
  maxFramerate: 10,
  maxBitrate: 1500000,
});

call.join({ create: true }).then(async () => {
  // render mic and camera controls
  const controls = renderControls(call);
  const container = document.getElementById('call-controls')!;
  container.appendChild(controls.audioButton);
  container.appendChild(controls.videoButton);
  container.appendChild(controls.screenShareButton);

  container.appendChild(renderAudioDeviceSelector(call));

  // render device selectors
  if (isMobile.any()) {
    container.appendChild(controls.flipButton);
  } else {
    container.appendChild(renderVideoDeviceSelector(call));
  }

  const audioOutputSelector = renderAudioOutputSelector(call);
  if (audioOutputSelector) {
    container.appendChild(audioOutputSelector);
  }

  container.appendChild(renderVolumeControl(call));
  const blurButton = document.createElement('button');
  blurButton.innerText = 'Blur';

  blurButton.addEventListener('click', async () => {
    const blurCanvas = document.getElementById(
      'blur-canvas',
    ) as HTMLCanvasElement;
    const ctx = blurCanvas.getContext('2d')!;
    const segmenter = await bodySegmentation.createSegmenter(
      bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
      {
        runtime: 'mediapipe',
        modelType: 'landscape',
        solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@${mpSelfieSegmentation.VERSION}`,
      },
    );

    const video = document.querySelector<HTMLVideoElement>('video')!;
    const render = async () => {
      const people = await segmenter.segmentPeople(video, {
        flipHorizontal: false,
        segmentBodyParts: true,
        multiSegmentation: false,
        segmentationThreshold: 0.7,
      });

      await bodySegmentation.drawBokehEffect(
        blurCanvas,
        video,
        people,
        0.9,
        20,
        10,
      );

      ctx.drawImage(video, 0, 0, blurCanvas.width, blurCanvas.height);

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  });

  container.appendChild(blurButton);
});

window.addEventListener('beforeunload', () => {
  call.leave();
});

const screenShareContainer = document.getElementById('screenshare')!;
const parentContainer = document.getElementById('participants')!;
call.setViewport(parentContainer);

call.state.participants$.subscribe((participants) => {
  // render / update existing participants
  participants.forEach((participant) => {
    renderParticipant(call, participant, parentContainer, screenShareContainer);
  });

  // Remove stale elements for stale participants
  parentContainer
    .querySelectorAll<HTMLMediaElement>('video, audio')
    .forEach((el) => {
      const sessionId = el.dataset.sessionId!;
      const participant = participants.find((p) => p.sessionId === sessionId);
      if (!participant) {
        cleanupParticipant(sessionId);
        el.remove();
      }
    });
});
