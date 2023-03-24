import React, {
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { FlatList, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { ParticipantView } from './ParticipantView';
import {
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { theme } from '../theme';
import { useDebounce } from '../utils/hooks';

type FlatListProps = React.ComponentProps<
  typeof FlatList<StreamVideoParticipant | StreamVideoLocalParticipant>
>;

const VIEWABILITY_CONFIG: FlatListProps['viewabilityConfig'] = {
  waitForInteraction: false,
  itemVisiblePercentThreshold: 60,
};

/**
 * The props for the CallParticipantsList component
 */
interface CallParticipantsListProps {
  /**
   * The list of participants to display in the list
   */
  participants: (StreamVideoParticipant | StreamVideoLocalParticipant)[];
  /**
   * The number of columns to display in the list of participants while in vertical or horizontal scrolling mode
   * @default 2
   */
  numColumns?: number;
  /**
   * If true, the list will be displayed in horizontal scrolling mode
   */
  horizontal?: boolean;
}

/**
 * The CallParticipantsList component displays a list of participants in a FlatList
 * NOTE: this component depends on a flex container to calculate the width and height of the participant view, hence it should be used only in a flex parent container
 */
export const CallParticipantsList = (props: CallParticipantsListProps) => {
  const { numColumns = 2, horizontal, participants } = props;
  const [containerWidth, setContainerWidth] = useState(0);

  // we use a HashSet to track the currently viewable participants
  // and a separate force update state to rerender the component to inform that the HashSet has changed
  // NOTE: we use set instead of array or object for O(1) lookup, add and delete
  const viewableParticipantSessionIds = useRef<Set<string>>(new Set());
  const [_forceUpdateValue, forceUpdate] = useReducer((x) => x + 1, 0);
  const forceUpdateValue = useDebounce(_forceUpdateValue, 500); // we debounce forced value to avoid multiple viewability change continuous rerenders due to callbacks that occurs simultaneously during a large list scroll or when scrolling is completed

  // This is the function that gets called when the user scrolls the list of participants.
  // It updates viewableParticipantSessionIds HashSet with the session IDs
  // of the participants that are currently visible.
  const onViewableItemsChanged = useRef<
    FlatListProps['onViewableItemsChanged']
  >(({ changed }) => {
    changed.forEach((viewToken) => {
      if (viewToken.isViewable) {
        viewableParticipantSessionIds.current.add(viewToken.key);
      } else {
        viewableParticipantSessionIds.current.delete(viewToken.key);
      }
    });
    if (changed.length) {
      forceUpdate();
    }
  }).current;

  // NOTE: key must be sessionId always as it is used to track viewable participants
  const keyExtractor = useRef<FlatListProps['keyExtractor']>(
    (item) => item.sessionId,
  ).current;

  const onLayout = useRef<FlatListProps['onLayout']>((event) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  }).current;

  const itemContainerStyle = useMemo<StyleProp<ViewStyle>>(() => {
    const size = containerWidth / numColumns;
    const style = { width: size, height: size };
    if (horizontal) {
      return [styles.participantWrapperHorizontal, style];
    }
    return [styles.participantWrapperVertical, style];
  }, [horizontal, numColumns, containerWidth]);

  const renderItem = useCallback<NonNullable<FlatListProps['renderItem']>>(
    ({ item: participant }) => {
      const isVideoViewable = viewableParticipantSessionIds.current.has(
        participant.sessionId,
      );
      return (
        <ParticipantView
          participant={participant}
          containerStyle={itemContainerStyle}
          kind="video"
          disableVideo={!isVideoViewable}
        />
      );
    },
    [itemContainerStyle],
  );

  return (
    <FlatList
      style={styles.container}
      onLayout={onLayout}
      key={!horizontal ? numColumns : undefined} // setting numColumns as key is a strict requirement of react-native to support changing numColumns on the fly
      data={participants}
      keyExtractor={keyExtractor}
      viewabilityConfig={VIEWABILITY_CONFIG}
      onViewableItemsChanged={onViewableItemsChanged}
      renderItem={renderItem}
      numColumns={!horizontal ? numColumns : undefined}
      horizontal={horizontal}
      showsHorizontalScrollIndicator={false}
      extraData={`${forceUpdateValue}${containerWidth}`} // this is important to force re-render when visibility changes
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  participantWrapperVertical: {
    margin: theme.margin.sm,
    overflow: 'hidden',
    borderRadius: theme.rounded.sm,
  },
  participantWrapperHorizontal: {
    marginHorizontal: theme.margin.sm,
    overflow: 'hidden',
    borderRadius: theme.rounded.sm,
  },
});
