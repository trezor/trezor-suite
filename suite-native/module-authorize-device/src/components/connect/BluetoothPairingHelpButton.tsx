import { useAlert } from '@suite-native/alerts';
import { IconButton } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { BluetoothPairingHints } from './BluetoothPairingHints';

type BluetoothPairingHelpButtonProps = {
    onShowAlert: () => void;
    onHideAlert: () => void;
};

export const BluetoothPairingHelpButton = ({
    onShowAlert,
    onHideAlert,
}: BluetoothPairingHelpButtonProps) => {
    const { showAlert } = useAlert();

    const showBluetoothPairingHintsAlert = () => {
        onShowAlert();
        showAlert({
            title: <Translation id="moduleConnectDevice.helpModal.pairing.hints.title" />,
            primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
            primaryButtonVariant: 'blueBold',
            onPressPrimaryButton: onHideAlert,
            appendix: <BluetoothPairingHints />,
        });
    };

    return (
        <IconButton
            colorScheme="tertiaryElevation0"
            size="medium"
            iconName="question"
            onPress={showBluetoothPairingHintsAlert}
        />
    );
};
