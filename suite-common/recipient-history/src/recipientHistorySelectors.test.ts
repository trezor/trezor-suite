import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type WalletAccountTransaction,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { selectAccountRecipientHistory } from './recipientHistorySelectors';

const OWN = '0x1111111111111111111111111111111111111111';
const LEGIT = '0x3333333333333333333333333333333333333333';

const ethAccount = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor(OWN),
});

const getVinVout = (address: string) => ({ addresses: [address], isAddress: true, n: 0 });

const getTransaction = (from: string, to: string) =>
    testMocks.getWalletTransaction({
        descriptor: ethAccount.descriptor,
        deviceState: ethAccount.deviceState,
        symbol: asNetworkSymbol('eth'),
        txid: `${from}-${to}`,
        targets: [],
        details: {
            vin: [getVinVout(from)],
            vout: [getVinVout(to)],
            size: 0,
            totalInput: '0',
            totalOutput: '0',
        },
    });

const getRecipientHistoryState = (account: Account, transactions: WalletAccountTransaction[]) => ({
    wallet: {
        accounts: [account],
        transactions: {
            transactions: { [account.key]: transactions },
            fetchStatusDetail: {},
        },
    },
});

describe(selectAccountRecipientHistory.name, () => {
    it('builds the history from the account transactions', () => {
        const state = getRecipientHistoryState(ethAccount, [getTransaction(OWN, LEGIT)]);

        const history = selectAccountRecipientHistory(state as never, ethAccount.key);

        expect(history?.sentTo.has(LEGIT)).toBe(true);
    });

    it('keeps the history when only the account balance changes', () => {
        const state = getRecipientHistoryState(ethAccount, [getTransaction(OWN, LEGIT)]);
        const stateAfterBalanceUpdate = {
            ...state,
            wallet: { ...state.wallet, accounts: [{ ...ethAccount, balance: '1' }] },
        };

        expect(
            selectAccountRecipientHistory(stateAfterBalanceUpdate as never, ethAccount.key),
        ).toBe(selectAccountRecipientHistory(state as never, ethAccount.key));
    });

    it('builds no history while the account transactions are not loaded', () => {
        expect(
            selectAccountRecipientHistory(
                getRecipientHistoryState(ethAccount, []) as never,
                ethAccount.key,
            ),
        ).toBeUndefined();
    });

    it('builds no history on networks where recipients are not checked', () => {
        const btcAccount = mockWalletAccount({ symbol: asNetworkSymbol('btc') });

        expect(
            selectAccountRecipientHistory(
                getRecipientHistoryState(btcAccount, [getTransaction(OWN, LEGIT)]) as never,
                btcAccount.key,
            ),
        ).toBeUndefined();
    });
});
