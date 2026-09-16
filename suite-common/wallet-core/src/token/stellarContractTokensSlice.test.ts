import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { type AccountKey } from '@suite-common/wallet-types';

import {
    type StellarContractTokensState,
    prepareStellarContractTokensReducer,
    selectStellarContractTokens,
    stellarContractTokensActions,
} from './stellarContractTokensSlice';

const stellarContractTokensReducer = prepareStellarContractTokensReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadStellarContractTokens: mockReducer() },
});

const accountKey = 'descriptor-xlm-session' as AccountKey;
const otherAccountKey = 'other-xlm-session' as AccountKey;
const contract = 'CBI7UCH5KGSVQRO5H4SUCZUTZABCITZLRHQQZTWL2TK4RZ72TAR6IHRV';
const otherContract = 'CC64WBDGS6QQP22QTTIACYIXT3WF7BBQEYOQPLTP7GTKYY7PZ74QYGSL';

const reduce = (state: StellarContractTokensState, ...actions: { type: string }[]) =>
    actions.reduce(stellarContractTokensReducer, state);

describe('stellarContractTokens', () => {
    it('adds a contract to the account that watches it', () => {
        const state = reduce(
            {},
            stellarContractTokensActions.addContractToken({ accountKey, contract }),
        );

        expect(
            selectStellarContractTokens({ wallet: { stellarContractTokens: state } }, accountKey),
        ).toEqual([contract]);
    });

    it('does not add the same contract twice', () => {
        const state = reduce(
            {},
            stellarContractTokensActions.addContractToken({ accountKey, contract }),
            stellarContractTokensActions.addContractToken({ accountKey, contract }),
        );

        expect(state[accountKey]).toEqual([contract]);
    });

    it('keeps each account list separate', () => {
        const state = reduce(
            {},
            stellarContractTokensActions.addContractToken({ accountKey, contract }),
            stellarContractTokensActions.addContractToken({
                accountKey: otherAccountKey,
                contract: otherContract,
            }),
        );

        expect(state[accountKey]).toEqual([contract]);
        expect(state[otherAccountKey]).toEqual([otherContract]);
    });

    it('removes only the given contract', () => {
        const state = reduce(
            {},
            stellarContractTokensActions.addContractToken({ accountKey, contract }),
            stellarContractTokensActions.addContractToken({
                accountKey,
                contract: otherContract,
            }),
            stellarContractTokensActions.removeContractToken({ accountKey, contract }),
        );

        expect(state[accountKey]).toEqual([otherContract]);
    });

    it('reports no contracts for an account that never added one', () => {
        expect(
            selectStellarContractTokens({ wallet: { stellarContractTokens: {} } }, accountKey),
        ).toEqual([]);
    });
});
