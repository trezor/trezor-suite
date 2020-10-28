import * as firmwareActions from '@firmware-actions/firmwareActions';
import { useActions, useSelector } from '@suite-hooks';

export const useFirmware = () => {
    const firmware = useSelector(state => state.firmware);

    const actions = useActions({
        toggleHasSeed: firmwareActions.toggleHasSeed,
        setStatus: firmwareActions.setStatus,
        firmwareUpdate: firmwareActions.firmwareUpdate,
    });

    return {
        ...firmware,
        ...actions,
    };
};
