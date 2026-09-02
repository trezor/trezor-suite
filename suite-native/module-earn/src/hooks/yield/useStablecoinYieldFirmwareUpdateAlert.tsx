import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import {
    type StablecoinYieldVaultToken,
    type YieldFlowType,
    isYieldSupported,
} from '@suite-common/wallet-core';
import { useTranslate } from '@suite-native/intl';

import { useFirmwareUpdateAlert } from '../earn/useFirmwareUpdateAlert';

export const useStablecoinYieldFirmwareUpdateAlert = () => {
    const { translate } = useTranslate();
    const selectedDevice = useSelector(selectSelectedDevice);
    const showFirmwareUpdateAlert = useFirmwareUpdateAlert(translate('earn.defiYield'));

    const isFirmwareSupported = useCallback(
        (flowType: YieldFlowType, vaultToken?: StablecoinYieldVaultToken) =>
            isYieldSupported(selectedDevice, { flowType, vaultToken }),
        [selectedDevice],
    );

    return {
        isFirmwareSupported,
        showFirmwareUpdateAlert,
    };
};
