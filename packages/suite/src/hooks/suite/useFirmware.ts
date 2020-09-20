import { useSelector } from 'react-redux';
import * as firmwareActions from '@firmware-actions/firmwareActions';
import { AppState } from '@suite-types';
import { useActions } from '@suite-hooks';

export const useFirmware = () => {
    const firmware = useSelector<AppState, AppState['firmware']>(state => state.firmware);

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
