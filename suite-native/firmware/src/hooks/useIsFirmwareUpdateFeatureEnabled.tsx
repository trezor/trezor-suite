import { useSelector } from 'react-redux';

import {
    selectIsFeatureEnabled,
    Feature,
    MessageSystemRootState,
} from '@suite-common/message-system';

export const useIsFirmwareUpdateFeatureEnabled = () => {
    const isFirmwareUpdateEnabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureEnabled(state, Feature.firmwareUpdate, true),
    );

    return isFirmwareUpdateEnabled;
};
