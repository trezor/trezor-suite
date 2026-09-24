import { StyleSheet } from 'react-native';
import { PortalHost } from 'react-native-teleport';

type KeyboardToolbarHostProps = {
    name: string;
};

export const KeyboardToolbarHost = ({ name }: KeyboardToolbarHostProps) => (
    <PortalHost name={name} style={StyleSheet.absoluteFill} />
);
