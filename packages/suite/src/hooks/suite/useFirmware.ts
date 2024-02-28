import { useDispatch } from 'react-redux';

import { FirmwareType } from '@trezor/connect';

import {
    checkFirmwareAuthenticity,
    firmwareUpdate_v2,
    selectFirmware,
    firmwareActions,
} from '@suite-common/wallet-core';
import { FirmwareStatus } from '@suite-common/suite-types';

import { useActions, useSelector, useDevice } from 'src/hooks/suite';
import { isWebUsb } from 'src/utils/suite/transport';
import { MODAL } from 'src/actions/suite/constants';
import { hasBitcoinOnlyFirmware, isBitcoinOnlyDevice } from '@trezor/device-utils';

export const useFirmware = () => {
    const dispatch = useDispatch();
    const firmware = useSelector(selectFirmware);
    const transport = useSelector(state => state.suite.transport);
    const modal = useSelector(state => state.modal);

    const showFingerprintCheck =
        modal.context === MODAL.CONTEXT_DEVICE &&
        modal.windowType === 'ButtonRequest_FirmwareCheck';

    const actions = useActions({
        firmwareUpdate: firmwareUpdate_v2,
        checkFirmwareAuthenticity,
        firmwareUpdate_v2,
    });

    const { device } = useDevice();

    const isCurrentlyBitcoinOnly = hasBitcoinOnlyFirmware(device);

    const getTargetFirmwareType = (shouldSwitchFirmwareType: boolean) => {
        const isBitcoinOnlyAvailable = !!device.firmwareRelease?.release.url_bitcoinonly;
        return (isCurrentlyBitcoinOnly && !shouldSwitchFirmwareType) ||
            // switching to Bitcoin-only
            (!isCurrentlyBitcoinOnly && shouldSwitchFirmwareType && isBitcoinOnlyAvailable) ||
            // Bitcoin-only device
            isBitcoinOnlyDevice(device)
            ? FirmwareType.BitcoinOnly
            : FirmwareType.Regular;
    };

    return {
        ...firmware,
        ...actions,
        toggleHasSeed: () => dispatch(firmwareActions.toggleHasSeed()),
        setStatus: (status: FirmwareStatus | 'error') =>
            dispatch(firmwareActions.setStatus(status)),
        resetReducer: () => dispatch(firmwareActions.resetReducer()),
        isWebUSB: isWebUsb(transport),
        showFingerprintCheck,
        getTargetFirmwareType,
    };
};
