import {
    Feature,
    initMessageSystemThunk,
    messageSystemActions,
    messageSystemInitialState,
} from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';

import { messageSystemMiddleware } from './messageSystemMiddleware';

jest.mock('@suite-native/discovery', () => ({
    selectDeviceEnabledDiscoveryNetworkSymbols: () => [],
}));

describe('messageSystemMiddleware', () => {
    it('should compute valid messages from the persisted config on message system init', () => {
        const { config } = mockMessageSystemStateWithFeatureFlags({
            [Feature.trading.restrictions.residenceWhitelistRequired]: true,
        });
        const dispatch = jest.fn();
        const getState = jest.fn().mockReturnValue({
            messageSystem: { ...messageSystemInitialState, config },
            device: { selectedDevice: undefined },
            geolocation: { countryCode: null },
        });

        messageSystemMiddleware({ dispatch, getState })(jest.fn())(
            initMessageSystemThunk.pending('requestId'),
        );

        expect(dispatch).toHaveBeenCalledWith(
            messageSystemActions.updateValidMessages(
                expect.objectContaining({
                    feature: config?.actions.map(action => action.message.id),
                }),
            ),
        );
    });
});
