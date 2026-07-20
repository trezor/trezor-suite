import { selectSelectedDevice } from '@suite-common/device';
import { selectCountryCode } from '@suite-common/geolocation';
import {
    categorizeMessages,
    getValidExperimentIds,
    getValidMessages,
    messageSystemActions,
    selectMessageSystemConfig,
} from '@suite-common/message-system';
import { createThunk } from '@suite-common/redux-utils';
import { selectDeviceEnabledDiscoveryNetworkSymbols } from '@suite-native/discovery';

const ACTION_PREFIX = '@suite-native/message-system';

export const revalidateMessageSystemThunk = createThunk(
    `${ACTION_PREFIX}/revalidate`,
    (_, { dispatch, getState }) => {
        const config = selectMessageSystemConfig(getState());
        const device = selectSelectedDevice(getState());
        const enabledNetworks = selectDeviceEnabledDiscoveryNetworkSymbols(getState());
        const countryCode = selectCountryCode(getState());

        const validationParams = {
            device,
            settings: {
                tor: false, // not supported in suite-native
                enabledNetworks,
            },
            countryCode,
        };

        const validMessages = getValidMessages(config, validationParams);
        const validExperimentIds = getValidExperimentIds(config, validationParams);

        const categorizedValidMessages = categorizeMessages(validMessages);

        dispatch(messageSystemActions.updateValidMessages(categorizedValidMessages));
        dispatch(messageSystemActions.updateValidExperiments(validExperimentIds));
    },
);
