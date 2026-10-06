import { useSelector } from 'react-redux';

import { selectIsWrappedNativeFlowSupported } from '@suite-common/wallet-core';
import { useTranslate } from '@suite-native/intl';

import { useFirmwareUpdateAlert } from './useFirmwareUpdateAlert';

export const useWrappedNativeFirmwareUpdateAlert = () => {
    const { translate } = useTranslate();
    const isFirmwareSupported = useSelector(selectIsWrappedNativeFlowSupported);
    const showFirmwareUpdateAlert = useFirmwareUpdateAlert(
        translate('earn.wrappedNativeToken.featureName'),
    );

    return { isFirmwareSupported, showFirmwareUpdateAlert };
};
