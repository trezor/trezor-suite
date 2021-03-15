import * as firmwareActions from '@firmware-actions/firmwareActions';
import { useActions, useSelector } from '@suite-hooks';
import { isWebUSB } from '@suite-utils/transport';

export const useFirmware = () => {
    const firmware = useSelector(state => state.firmware);
    const transport = useSelector(state => state.suite.transport);

    const actions = useActions({
        toggleHasSeed: firmwareActions.toggleHasSeed,
        setStatus: firmwareActions.setStatus,
        firmwareUpdate: firmwareActions.firmwareUpdate,
        resetReducer: firmwareActions.resetReducer,
    });

    return {
        ...firmware,
        ...actions,
        isWebUSB: isWebUSB(transport),
    };
};
