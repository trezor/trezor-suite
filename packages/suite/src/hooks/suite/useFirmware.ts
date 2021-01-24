import * as firmwareActions from '@firmware-actions/firmwareActions';
import { useSelector } from '@suite-hooks/useSelector';
import { useActions } from '@suite-hooks/useActions';

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
