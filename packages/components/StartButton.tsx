import React from 'react';
import { Button } from 'react-native';

interface Props {
    onPress: () => void;
}

export const StartButton = (props: Props) => {
    return <Button onPress={props.onPress} title="Start" />;
};
