import { testMocks } from '@suite-common/test-utils';
import { thpActions } from '@suite-common/thp';
import { deviceConnectThunks } from '@suite-common/wallet-core';

import { isDeviceConnectAction } from '../utils';

const { getConnectDevice } = testMocks;

describe('isDeviceConnectAction', () => {
    it('should return true for thpActions.finishThpFlow action', () => {
        const action = thpActions.finishThpFlow();

        expect(isDeviceConnectAction(action)).toBe(true);
    });

    it('should return true for deviceConnectThunks.fulfilled action without THP', () => {
        const device = getConnectDevice({
            thp: undefined,
        });

        const action = {
            type: deviceConnectThunks.fulfilled.type,
            meta: {
                arg: { device },
            },
        };

        expect(isDeviceConnectAction(action)).toBe(true);
    });

    it('should return false for deviceConnectThunks.fulfilled action with THP', () => {
        const device = getConnectDevice({
            thp: {
                channel: '00',
                credentials: [],
                expectedResponses: [],
                recvBit: 0,
                recvNonce: 0,
                sendBit: 0,
                sendNonce: 0,
            },
        });

        const action = {
            type: deviceConnectThunks.fulfilled.type,
            meta: {
                arg: { device },
            },
        };

        expect(isDeviceConnectAction(action)).toBe(false);
    });

    it('should return false for unrelated action', () => {
        const action = {
            type: 'SOME_OTHER_ACTION',
            payload: {},
        };

        expect(isDeviceConnectAction(action)).toBe(false);
    });
});
