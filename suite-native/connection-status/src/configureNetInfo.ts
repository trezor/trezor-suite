import { configure } from '@react-native-community/netinfo';

export const configureNetInfo = () => {
    configure({
        reachabilityUrl: 'https://cdn.trezor.io/204',
    });
};
