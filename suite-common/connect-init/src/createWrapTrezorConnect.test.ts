import { mock } from '@suite-common/dependency-injection';
import { deviceInitialState } from '@suite-common/device';
import { createMockDispatch } from '@suite-common/redux-utils/mocks';
import { type LockDevice } from '@suite-common/suite-types';
import { testMocks } from '@suite-common/test-utils';

import { type WrapTrezorConnectDeps, createWrapTrezorConnect } from './createWrapTrezorConnect';

describe('createWrapTrezorConnect', () => {
    beforeEach(() => {
        testMocks.setTrezorConnectFixtures();
    });

    it('locks the device around a wrapped method and clears button requests', async () => {
        const getState = () => ({ device: deviceInitialState });
        const { actions, dispatch } = createMockDispatch({ getState });
        const deps: WrapTrezorConnectDeps = {
            dispatch,
            getState,
            lockDevice: mock<LockDevice>(),
        };

        createWrapTrezorConnect(deps)();
        await testMocks.getTrezorConnectMock().getFeatures();

        expect(deps.lockDevice).toHaveBeenNthCalledWith(1, true);
        expect(deps.lockDevice).toHaveBeenNthCalledWith(2, false);
        expect(actions).toEqual([
            expect.objectContaining({ type: '@suite/device/removeButtonRequests' }),
        ]);
    });
});
