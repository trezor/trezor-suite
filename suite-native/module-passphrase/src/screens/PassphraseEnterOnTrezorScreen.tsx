import { useDispatch, useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import { cancelDiscoveryThunk } from '@suite-common/wallet-core';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useNavigateToInitialScreen } from '@suite-native/navigation';
import {
    PassphraseContentScreenWrapper,
    PassphraseEnterOnTrezorScreenContent,
} from '@suite-native/passphrase';

import { PassphraseScreenHeader } from '../components/PassphraseScreenHeader';
import { usePassphraseMismatchAlert } from '../hooks/usePassphraseMismatchAlert';

export const PassphraseEnterOnTrezorScreen = () => {
    const dispatch = useDispatch();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const device = useSelector(selectSelectedDevice);
    const { onPassphraseMismatchAlert } = usePassphraseMismatchAlert();

    // Note: This is only needed for verification of empty passphrase wallet.
    // Consider splitting this screen into 2 and only having this effect in the second one in the flow
    // to prevent unnecessary focus effect on first screen instance in flow.
    useFocusEffect(onPassphraseMismatchAlert);

    const handleCancel = () => {
        if (!device) return;
        dispatch(cancelDiscoveryThunk(device));
        navigateToInitialScreen();
    };

    return (
        <PassphraseContentScreenWrapper
            header={<PassphraseScreenHeader />}
            title={<Translation id="modulePassphrase.title" />}
            subtitle={
                <Translation
                    id="modulePassphrase.subtitle"
                    values={{
                        bold: chunks => <Text variant="body-md-strong">{chunks}</Text>,
                    }}
                />
            }
        >
            <PassphraseEnterOnTrezorScreenContent onCancel={handleCancel} />
        </PassphraseContentScreenWrapper>
    );
};
