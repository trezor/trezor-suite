import { useDispatch } from 'react-redux';

import { FirmwareType, UI } from '@trezor/connect';

import {
    checkFirmwareAuthenticity,
    firmwareUpdate,
    selectFirmware,
    firmwareActions,
} from '@suite-common/wallet-core';
import { FirmwareStatus } from '@suite-common/suite-types';

import { useActions, useSelector, useDevice, useTranslation } from 'src/hooks/suite';
import { isWebUsb } from 'src/utils/suite/transport';
import { MODAL } from 'src/actions/suite/constants';
import { hasBitcoinOnlyFirmware, isBitcoinOnlyDevice } from '@trezor/device-utils';

export const useFirmware = () => {
    const { translationString } = useTranslation();
    const dispatch = useDispatch();
    const firmware = useSelector(selectFirmware);
    const transport = useSelector(state => state.suite.transport);
    const modal = useSelector(state => state.modal);

    const showFingerprintCheck =
        modal.context === MODAL.CONTEXT_DEVICE &&
        modal.windowType === 'ButtonRequest_FirmwareCheck';

    const actions = useActions({
        firmwareUpdate,
        checkFirmwareAuthenticity,
    });

    const { device } = useDevice();

    const isCurrentlyBitcoinOnly = hasBitcoinOnlyFirmware(device);

    const getUpdateStatus = () => {
        if (firmware.status === 'done') {
            return {
                operation: translationString('TR_FIRMWARE_STATUS_INSTALLATION_COMPLETED'),
                progress: 100,
            };
        }
        if (firmware.uiEvent?.type === UI.FIRMWARE_PROGRESS) {
            switch (firmware.uiEvent.payload.operation) {
                case 'flashing':
                    return {
                        operation: translationString('TR_INSTALLING'),
                        progress: firmware.uiEvent.payload.progress,
                    };
                case 'validating':
                    return {
                        operation: translationString('TR_VALIDATION'),
                        progress: 100,
                    };
            }
        }
        if (
            (firmware.uiEvent?.type === UI.FIRMWARE_DISCONNECT &&
                !firmware.uiEvent.payload.manual) ||
            (firmware.uiEvent?.type === UI.FIRMWARE_RECONNECT &&
                !firmware.uiEvent.payload.bootloader)
        ) {
            return { operation: translationString('TR_WAIT_FOR_REBOOT'), progress: 100 };
        }

        return { operation: null, progress: 0 };
    };

    const getTargetFirmwareType = (shouldSwitchFirmwareType: boolean) => {
        const isBitcoinOnlyAvailable = !!device?.firmwareRelease?.release.url_bitcoinonly;

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
        ...getUpdateStatus(),
        toggleHasSeed: () => dispatch(firmwareActions.toggleHasSeed()),
        setStatus: (status: FirmwareStatus | 'error') =>
            dispatch(firmwareActions.setStatus(status)),
        resetReducer: () => dispatch(firmwareActions.resetReducer()),
        isWebUSB: isWebUsb(transport),
        showFingerprintCheck,
        getTargetFirmwareType,
    };
};
