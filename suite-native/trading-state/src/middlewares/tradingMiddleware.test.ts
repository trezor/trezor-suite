import { deviceActions } from '@suite-common/device';
import type { TrezorDevice } from '@suite-common/suite-types';
import { formDraftActions } from '@suite-common/wallet-core';

import { buyActions, exchangeActions, sellActions, tradingActions } from '../reducers';
import { getFormDraftKeyByTradeType } from '../utils';
import { prepareTradingMiddleware } from './tradingMiddleware';

describe('tradingMiddleware', () => {
    const tradingMiddleware = prepareTradingMiddleware(() => ({}));
    const next = jest.fn();
    const dispatch = jest.fn();
    const getState = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        getState.mockReturnValue({
            device: {
                selectedDevice: {
                    id: 'device-id',
                    instance: 1,
                    connected: false,
                } as unknown as TrezorDevice,
            },
        });
    });

    it('should do nothing on general action', () => {
        const action = { type: 'GENERAL_ACTION' };
        const ret = tradingMiddleware({ dispatch, getState })(next)(action);

        expect(ret).toBe(action);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(action);
        expect(dispatch).not.toHaveBeenCalled();
        expect(getState).not.toHaveBeenCalled();
    });

    it.each([
        tradingActions.setTradingEnvironment('dev'),
        buyActions.clearState(),
        exchangeActions.clearState(),
        sellActions.clearState(),
    ])('should remove drafts on %s action', action => {
        const ret = tradingMiddleware({ dispatch, getState })(next)(action);

        expect(ret).toBe(action);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(action);

        expect(dispatch).toHaveBeenCalledTimes(2);
        expect(dispatch).toHaveBeenCalledWith(
            formDraftActions.removeDraft({ key: getFormDraftKeyByTradeType('sell') }),
        );
        expect(dispatch).toHaveBeenCalledWith(
            formDraftActions.removeDraft({ key: getFormDraftKeyByTradeType('exchange') }),
        );

        expect(getState).not.toHaveBeenCalled();
    });

    it('should clear form and remove drafts on select device action', () => {
        const action = deviceActions.selectDevice({} as unknown as TrezorDevice);

        const ret = tradingMiddleware({ dispatch, getState })(next)(action);

        expect(ret).toBe(action);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(action);

        expect(dispatch).toHaveBeenCalledTimes(3);
        expect(dispatch).toHaveBeenCalledWith(
            formDraftActions.removeDraft({ key: getFormDraftKeyByTradeType('sell') }),
        );
        expect(dispatch).toHaveBeenCalledWith(
            formDraftActions.removeDraft({ key: getFormDraftKeyByTradeType('exchange') }),
        );
        expect(dispatch).toHaveBeenCalledWith(tradingActions.clearSelectedAccounts());

        expect(getState).not.toHaveBeenCalled();
    });

    it('should do nothing when selectDevice action is called after device connection', () => {
        const action = deviceActions.selectDevice({
            id: 'device-id',
            instance: 1,
            connected: true,
        } as unknown as TrezorDevice);
        tradingMiddleware({ dispatch, getState })(next)(action);

        expect(dispatch).not.toHaveBeenCalled();
    });

    it('should not skip remove drafts when selectDevice action is called with connected: false', () => {
        const action = deviceActions.selectDevice({
            id: 'device-id',
            instance: 1,
            connected: false,
        } as unknown as TrezorDevice);
        tradingMiddleware({ dispatch, getState })(next)(action);

        expect(dispatch).toHaveBeenCalledWith(
            formDraftActions.removeDraft({ key: getFormDraftKeyByTradeType('sell') }),
        );
    });

    it('should not skip remove drafts when selectDevice action selects another device', () => {
        const action = deviceActions.selectDevice({
            id: 'device-id-2',
            instance: 1,
            connected: true,
        } as unknown as TrezorDevice);
        tradingMiddleware({ dispatch, getState })(next)(action);

        expect(dispatch).toHaveBeenCalledWith(
            formDraftActions.removeDraft({ key: getFormDraftKeyByTradeType('sell') }),
        );
    });

    it('should not skip remove drafts when selectDevice action selects another passphrase wallet', () => {
        const action = deviceActions.selectDevice({
            id: 'device-id',
            instance: 2,
            connected: true,
        } as unknown as TrezorDevice);
        tradingMiddleware({ dispatch, getState })(next)(action);

        expect(dispatch).toHaveBeenCalledWith(
            formDraftActions.removeDraft({ key: getFormDraftKeyByTradeType('sell') }),
        );
    });
});
