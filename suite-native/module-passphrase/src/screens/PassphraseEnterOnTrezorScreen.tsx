import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { cancelDiscoveryThunk } from '@suite-common/wallet-core';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useNavigateToInitialScreen } from '@suite-native/navigation';
import {
    PassphraseContentScreenWrapper,
    PassphraseEnterOnTrezorScreenContent,
} from '@suite-native/passphrase';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const PassphraseEnterOnTrezorScreen = () => {
    const { dispatch } = useServices(injectDispatch);
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
                        bold: chunks => <Text variant="body-md-strong">{chunks}</Text>,
                    }}
                />
            }
        >
            <PassphraseEnterOnTrezorScreenContent onCancel={handleCancel} />
        </PassphraseContentScreenWrapper>
    );
};
