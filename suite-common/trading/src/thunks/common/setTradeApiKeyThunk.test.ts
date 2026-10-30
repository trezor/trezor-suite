import { asAccountDescriptor } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { type SetTradeApiKeyThunkState, setTradeApiKeyThunk } from './setTradeApiKeyThunk';
import {
    type TradingState,
    initialState,
    tradingActions,
} from '../../reducers/tradingCommonReducer';
import { tradeApi } from '../../tradeApi';
import { createSaltedTradeApiKey } from '../../utils/tradeApiSaltUtils';

const deviceState = 'device-id@wallet-id:0' as StaticSessionId;
const account = { descriptor: asAccountDescriptor('xpub-descriptor'), deviceState };
const deviceSalt = 'aa'.repeat(32);
const installSalt = 'bb'.repeat(32);

const setApiKeySpy = jest.spyOn(tradeApi, 'setApiKey');

const runThunk = async (trading: Partial<TradingState>) => {
    const state: SetTradeApiKeyThunkState = {
        wallet: { trading: { ...initialState, ...trading } },
    };
    const getState = () => state;
    const { actions, dispatch } = createMockDispatch({ getState, extra: {} });

    await dispatch(setTradeApiKeyThunk({ account }));

    return actions.filter(tradingActions.setTradeApiInstallSalt.match);
};

describe('setTradeApiKeyThunk', () => {
    beforeEach(() => {
        setApiKeySpy.mockReset();
    });

    it.each([
        { scenario: 'remembered', trading: { tradeApiSalts: { [deviceState]: deviceSalt } } },
        { scenario: 'session', trading: { tradeApiSessionSalts: { [deviceState]: deviceSalt } } },
    ])('salts the key with the $scenario device salt of the wallet', async ({ trading }) => {
        const installSaltActions = await runThunk({ ...trading, tradeApiInstallSalt: installSalt });

        expect(setApiKeySpy).toHaveBeenCalledWith(
            createSaltedTradeApiKey({ descriptor: account.descriptor, salt: deviceSalt }),
        );
        expect(installSaltActions).toEqual([]);
    });

    it('falls back to the install salt when the wallet has no device salt', async () => {
        const installSaltActions = await runThunk({ tradeApiInstallSalt: installSalt });

        expect(setApiKeySpy).toHaveBeenCalledWith(
            createSaltedTradeApiKey({ descriptor: account.descriptor, salt: installSalt }),
        );
        expect(installSaltActions).toEqual([]);
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
