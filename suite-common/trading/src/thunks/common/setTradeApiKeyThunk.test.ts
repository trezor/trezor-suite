import { asAccountDescriptor } from '@suite-common/wallet-types';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { type SetTradeApiKeyThunkState, setTradeApiKeyThunk } from './setTradeApiKeyThunk';
import {
    type TradingState,
    initialState,
    tradingActions,
} from '../../reducers/tradingCommonReducer';
import { tradeApi } from '../../tradeApi';
import { createInstallTradeApiKey, createSaltedTradeApiKey } from '../../utils/tradeApiSaltUtils';

const account = { descriptor: asAccountDescriptor('xpub-descriptor') };
const installSalt = 'bb'.repeat(32);

const setApiKeySpy = jest.spyOn(tradeApi, 'setApiKey');

const runThunk = async (
    trading: Partial<TradingState>,
    params: Parameters<typeof setTradeApiKeyThunk>[0] = { account },
) => {
    const state: SetTradeApiKeyThunkState = {
        wallet: { trading: { ...initialState, ...trading } },
    };
    const getState = () => state;
    const { actions, dispatch } = createMockDispatch({ getState, extra: {} });

    await dispatch(setTradeApiKeyThunk(params));

    return actions.filter(tradingActions.setTradeApiInstallSalt.match);
};

describe('setTradeApiKeyThunk', () => {
    beforeEach(() => {
        setApiKeySpy.mockReset();
    });

    it('salts the key of the account with the install salt', async () => {
        const installSaltActions = await runThunk({ tradeApiInstallSalt: installSalt });

        expect(setApiKeySpy).toHaveBeenCalledWith(
            createSaltedTradeApiKey({ descriptor: account.descriptor, salt: installSalt }),
        );
        expect(installSaltActions).toEqual([]);
    });

    it('uses the install key when there is no account', async () => {
        await runThunk({ tradeApiInstallSalt: installSalt }, { account: undefined });

        expect(setApiKeySpy).toHaveBeenCalledWith(createInstallTradeApiKey(installSalt));
    });

    it('generates, stores and uses a random install salt when none exists yet', async () => {
        const installSaltActions = await runThunk({});

        const [generatedSalt] = installSaltActions.map(({ payload }) => payload);
        expect(generatedSalt).toMatch(/^[0-9a-f]{64}$/);
        expect(setApiKeySpy).toHaveBeenCalledWith(
            createSaltedTradeApiKey({ descriptor: account.descriptor, salt: generatedSalt ?? '' }),
        );
    });
});
