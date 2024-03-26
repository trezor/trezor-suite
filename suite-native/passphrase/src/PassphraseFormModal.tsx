import { Modal } from 'react-native';
import { useSelector } from 'react-redux';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectDevice, selectDeviceFeatures } from '@suite-common/wallet-core';

import { PassphraseForm } from './PassphraseForm';
import { PassphraseNotEnabled } from './PassphraseNotEnabled';

const modalBackgroundOverlayStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'center',
    backgroundColor: utils.transparentize(0.3, utils.colors.backgroundNeutralBold),
}));

export const PassphraseFormModal = () => {
    const device = useSelector(selectDevice);
    const deviceFeatures = useSelector(selectDeviceFeatures);

    const { applyStyle } = useNativeStyles();

    if (!device) return null;

    return (
        <Modal transparent animationType="fade">
            <Box style={applyStyle(modalBackgroundOverlayStyle)}>
                {deviceFeatures?.passphrase_protection ? (
                    <PassphraseForm />
                ) : (
                    <PassphraseNotEnabled />
                )}
            </Box>
        </Modal>
    );
};
