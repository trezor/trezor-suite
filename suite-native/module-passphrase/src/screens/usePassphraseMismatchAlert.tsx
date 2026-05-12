import { useFocusEffect } from '@react-navigation/native';

import { usePassphraseMismatchAlert } from '@suite-native/passphrase';

import { PassphraseLoadingScreen } from './PassphraseLoadingScreen';

export const PassphraseMismatchAlertScreen = () => {
    const { onPassphraseMismatchAlert } = usePassphraseMismatchAlert();

    useFocusEffect(onPassphraseMismatchAlert);

    return <PassphraseLoadingScreen />;
};
