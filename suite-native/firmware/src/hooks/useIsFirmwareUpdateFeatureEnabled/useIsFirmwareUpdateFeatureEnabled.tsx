import { useSelector } from 'react-redux';

import {
    Feature,
    MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';

export const useIsFirmwareUpdateFeatureEnabled = () => {
    const isFirmwareUpdateEnabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureEnabled(state, Feature.firmwareUpdate, true),
    );

    return isFirmwareUpdateEnabled;
};
