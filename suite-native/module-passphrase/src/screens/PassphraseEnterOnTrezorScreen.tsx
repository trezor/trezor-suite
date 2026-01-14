import { useDispatch, useSelector } from 'react-redux';

import { cancelDiscoveryThunk, selectSelectedDevice } from '@suite-common/wallet-core';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useNavigateToInitialScreen } from '@suite-native/navigation';
import {
    PassphraseContentScreenWrapper,
    PassphraseEnterOnTrezorScreenContent,
} from '@suite-native/passphrase';

export const PassphraseEnterOnTrezorScreen = () => {
    const dispatch = useDispatch();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const device = useSelector(selectSelectedDevice);

    const handleCancel = () => {
        if (device) {
            dispatch(cancelDiscoveryThunk(device));
        }
        navigateToInitialScreen();
    };

    return (
        <PassphraseContentScreenWrapper
            title={<Translation id="modulePassphrase.title" />}
            subtitle={
                <Translation
                    id="modulePassphrase.subtitle"
                    values={{
                        bold: chunks => <Text variant="highlight">{chunks}</Text>,
                    }}
                />
            }
        >
            <PassphraseEnterOnTrezorScreenContent onCancel={handleCancel} />
        </PassphraseContentScreenWrapper>
    );
};
