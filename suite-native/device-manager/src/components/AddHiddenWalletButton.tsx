import { useDispatch, useSelector } from 'react-redux';

import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { createDeviceInstance, selectDevice } from '@suite-common/wallet-core';

import { useDeviceManager } from '../hooks/useDeviceManager';

export const AddHiddenWalletButton = () => {
    const dispatch = useDispatch();

    const device = useSelector(selectDevice);

    const { setIsDeviceManagerVisible } = useDeviceManager();

    const handleAddHiddenWallet = () => {
        if (!device) return;

        setIsDeviceManagerVisible(false);
        dispatch(createDeviceInstance({ device }));
    };

    return (
        <Button colorScheme="tertiaryElevation1" onPress={handleAddHiddenWallet}>
            <Translation id="deviceManager.deviceButtons.addHiddenWallet" />
        </Button>
    );
};
