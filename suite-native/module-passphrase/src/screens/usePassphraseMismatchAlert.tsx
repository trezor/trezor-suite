import { useFocusEffect } from '@react-navigation/native';

import { PassphraseLoadingScreen } from './PassphraseLoadingScreen';
import { usePassphraseMismatchAlert } from '../hooks/usePassphraseMismatchAlert';

export const PassphraseMismatchAlertScreen = () => {
    const { onPassphraseMismatchAlert } = usePassphraseMismatchAlert();

    useFocusEffect(onPassphraseMismatchAlert);

    return <PassphraseLoadingScreen />;
};
