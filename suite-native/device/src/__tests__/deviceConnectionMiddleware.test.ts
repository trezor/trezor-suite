import { configureMockStore } from '@suite-common/test-utils';
import { navigationContainerRef } from '@suite-native/navigation';

import { invalidThpPairingFixtures, validThpPairingFixtures } from './deviceConnectionFixtures';
import { deviceConnectionMiddleware } from '../middlewares/deviceConnectionMiddleware';

jest.mock('@suite-native/navigation', () => {
    const navigation = jest.requireActual('@suite-native/navigation');

    return {
        ...navigation,
        navigationContainerRef: {
            navigate: jest.fn(),
        },
    };
});

describe('Ignored UI button request redirects', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    invalidThpPairingFixtures.forEach(({ description, action, initialState }) => {
        it(description, () => {
            const mockStore = configureMockStore({
                middleware: [deviceConnectionMiddleware.middleware],
                preloadedState: initialState,
            });
            mockStore.dispatch(action);

            expect(navigationContainerRef.navigate).toHaveBeenCalledTimes(0);
        });
    });
});

describe('THP confirmation redirect upon button request', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    validThpPairingFixtures.forEach(({ description, action, redirectTarget, initialState }) => {
        it(description, () => {
            const mockStore = configureMockStore({
                middleware: [deviceConnectionMiddleware.middleware],
                preloadedState: initialState,
            });
            mockStore.dispatch(action);

            expect(navigationContainerRef.navigate).toHaveBeenCalledWith(
                redirectTarget.route,
                redirectTarget.params,
            );
        });
    });
});
