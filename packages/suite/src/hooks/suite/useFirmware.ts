import { useDispatch } from 'react-redux';

import { checkFirmwareAuthenticity, firmwareActions } from 'src/actions/firmware/firmwareActions';
import { firmwareCustom, firmwareUpdate } from 'src/actions/firmware/firmwareThunks';
import { useActions, useSelector } from 'src/hooks/suite';
import { isWebUsb } from 'src/utils/suite/transport';
import { MODAL } from 'src/actions/suite/constants';
import { FirmwareStatus, selectFirmware } from 'src/reducers/firmware/firmwareReducer';

export const useFirmware = () => {
    const dispatch = useDispatch();
    const firmware = useSelector(selectFirmware);
    const { transport, modal } = useSelector(state => ({
        modal: state.modal,
        transport: state.suite.transport,
    }));

    const showFingerprintCheck =
        modal.context === MODAL.CONTEXT_DEVICE &&
        modal.windowType === 'ButtonRequest_FirmwareCheck';

    const actions = useActions({
        firmwareUpdate,
        firmwareCustom,
        checkFirmwareAuthenticity,
    });

    return {
        ...firmware,
        ...actions,
        toggleHasSeed: () => dispatch(firmwareActions.toggleHasSeed()),
        setStatus: (status: FirmwareStatus | 'error') =>
            dispatch(firmwareActions.setStatus(status)),
        resetReducer: () => dispatch(firmwareActions.resetReducer()),
        isWebUSB: isWebUsb(transport),
        showFingerprintCheck,
    };
};
