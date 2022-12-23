import { Call } from './Call';
import { Dispatcher } from './Dispatcher';
import { StreamVideoWriteableStateStore } from '../store';
import {
  watchParticipantJoined,
  watchParticipantLeft,
  watchTrackPublished,
  watchTrackUnpublished,
} from '../events/participant';
import {
  watchChangePublishQuality,
  watchConnectionQualityChanged,
} from '../events/internal';
import {
  watchAudioLevelChanged,
  watchDominantSpeakerChanged,
} from '../events/speaker';
import { Batcher } from '../Batcher';

export const registerEventHandlers = (
  call: Call,
  store: StreamVideoWriteableStateStore,
  dispatcher: Dispatcher,
  userBatcher: Batcher<string>,
) => {
  watchChangePublishQuality(dispatcher, call);
  watchConnectionQualityChanged(dispatcher, store);

  watchParticipantJoined(dispatcher, store, userBatcher);
  watchParticipantLeft(dispatcher, store);

  watchTrackPublished(dispatcher, store);
  watchTrackUnpublished(dispatcher, store);

  watchAudioLevelChanged(dispatcher, store);
  watchDominantSpeakerChanged(dispatcher, store);
};
