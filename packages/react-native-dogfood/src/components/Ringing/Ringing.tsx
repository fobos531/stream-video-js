import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import {
  useAppGlobalStoreValue,
  useAppGlobalStoreSetState,
} from '../../contexts/AppContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types';
import { joinCall } from '../../utils/callUtils';
import { useStore } from '../../hooks/useStore';
import { useObservableValue } from '../../hooks/useObservable';

const styles = StyleSheet.create({
  container: {
    margin: 15,
  },
  headerText: {
    color: 'black',
    fontSize: 20,
    marginVertical: 8,
  },
  textInput: {
    color: '#000',
    height: 40,
    width: '100%',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'gray',
    paddingLeft: 10,
    marginVertical: 8,
  },
  participantsContainer: {
    marginVertical: 20,
  },
  text: {
    color: 'black',
  },
  label: {
    fontSize: 20,
  },
  participant: {
    paddingVertical: 10,
    borderBottomColor: 'gray',
    borderBottomWidth: 1,
  },
  selectedParticipant: {
    color: 'red',
    fontWeight: 'bold',
  },
});

type Props = NativeStackScreenProps<RootStackParamList, 'HomeScreen'>;

const Ringing = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(false);
  const videoClient = useAppGlobalStoreValue((store) => store.videoClient);
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );
  const username = useAppGlobalStoreValue((store) => store.username);
  const ringingUsers = useAppGlobalStoreValue((store) => store.ringingUsers);
  const { activeRingCallMeta$ } = useStore();
  const activeRingCallMeta = useObservableValue(activeRingCallMeta$);

  const users = [
    { id: 'steve', name: 'Steve Galilli' },
    { id: 'khushal', name: 'Khushal Agarwal' },
    { id: 'santhosh', name: 'Santhosh Vaiyapuri' },
    { id: 'oliver', name: 'Oliver Lazoroski' },
    { id: 'zita', name: 'Zita Szupera' },
  ];

  useEffect(() => {
    if (activeRingCallMeta) {
      navigation.navigate('OutgoingCallScreen');
    }
  }, [navigation, activeRingCallMeta]);

  const setState = useAppGlobalStoreSetState();

  const startCallHandler = async () => {
    setLoading(true);
    if (videoClient && localMediaStream) {
      try {
        const callID = uuidv4().toLowerCase();
        await setState({ ringingCallID: callID });
        await joinCall(videoClient, localMediaStream, {
          autoJoin: true,
          ring: true,
          members: ringingUsers.map((user) => {
            return {
              userId: user,
              role: 'member',
              customJson: new Uint8Array(),
            };
          }),
          callId: callID,
          callType: 'default',
        }).then(() => {
          setLoading(false);
        });
      } catch (err) {
        console.log(err);
      }
    }
  };

  const ringingUsersSetHandler = (userId: string) => {
    if (!ringingUsers.includes(userId)) {
      setState({ ringingUsers: [...ringingUsers, userId] });
    } else {
      setState({
        ringingUsers: ringingUsers.filter(
          (ringingUser) => ringingUser !== userId,
        ),
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.participantsContainer}>
        <Text style={[styles.text, styles.label]}>Select Participants</Text>
        {users
          .filter((user) => user.id !== username)
          .map((user) => {
            return (
              <Pressable
                style={styles.participant}
                key={user.id}
                onPress={() => ringingUsersSetHandler(user.id)}
              >
                <Text
                  style={[
                    styles.text,
                    ringingUsers.includes(user.id)
                      ? styles.selectedParticipant
                      : null,
                  ]}
                >
                  {user.name + ' - id: ' + user.id}
                </Text>
              </Pressable>
            );
          })}
      </View>
      <Button
        disabled={ringingUsers.length === 0}
        title="Start a Call"
        onPress={startCallHandler}
      />
      {loading && <ActivityIndicator />}
    </SafeAreaView>
  );
};

export default Ringing;
