import * as firmwareActions from '@firmware-actions/firmwareActions';
import { useActions, useSelector } from '@suite-hooks';
import { isWebUSB } from '@suite-utils/transport';
import { MODAL } from '@suite/actions/suite/constants';

export const useFirmware = () => {
    const { firmware, transport, modal } = useSelector(state => ({
        firmware: state.firmware,
        modal: state.modal,
        transport: state.suite.transport,
    }));

    const showFingerprintCheck =
        modal.context === MODAL.CONTEXT_DEVICE &&
        modal.windowType === 'ButtonRequest_FirmwareCheck';

    const actions = useActions({
        toggleHasSeed: firmwareActions.toggleHasSeed,
        setStatus: firmwareActions.setStatus,
        firmwareUpdate: firmwareActions.firmwareUpdate,
        firmwareCustom: firmwareActions.firmwareCustom,
        resetReducer: firmwareActions.resetReducer,
    });

    return {
        ...firmware,
        ...actions,
        isWebUSB: isWebUSB(transport),
        showFingerprintCheck,
    };
};
