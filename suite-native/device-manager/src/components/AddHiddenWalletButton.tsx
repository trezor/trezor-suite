import { useSetAtom } from 'jotai';

import { Button } from '@suite-native/atoms';
import { isPassphraseModalVisibleAtom } from '@suite-native/passphrase';
import { useTranslate } from '@suite-native/intl';

import { useDeviceManager } from '../hooks/useDeviceManager';

export const AddHiddenWalletButton = () => {
    const { translate } = useTranslate();

    const setIsPassphraseVisibleAtom = useSetAtom(isPassphraseModalVisibleAtom);

    const { setIsDeviceManagerVisible } = useDeviceManager();

    const handleAddHiddenWallet = () => {
        setIsDeviceManagerVisible(false);
        setIsPassphraseVisibleAtom(true);
        // await dispatch(createDeviceInstance({ device: instance }));
    };

    return (
        <Button colorScheme="tertiaryElevation1" onPress={handleAddHiddenWallet}>
            {translate('deviceManager.deviceButtons.addHiddenWallet')}
        </Button>
    );
};
