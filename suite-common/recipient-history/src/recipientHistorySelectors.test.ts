import { testMocks } from '@suite-common/test-utils';
import { type TokenDefinitionsState } from '@suite-common/token-definitions';
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
const DUSTER = '0x4444444444444444444444444444444444444444';

const ethAccount = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor(OWN),
});

const getVinVout = (address: string) => ({ addresses: [address], isAddress: true, n: 0 });

type GetTransactionParams = {
    from: string;
    to: string;
    type?: 'sent' | 'recv';
    amount?: string;
};

const getTransaction = ({ from, to, type = 'sent', amount = '10' }: GetTransactionParams) =>
    testMocks.getWalletTransaction({
        descriptor: ethAccount.descriptor,
        deviceState: ethAccount.deviceState,
        symbol: asNetworkSymbol('eth'),
        txid: `${from}-${to}`,
        type,
        amount,
        targets: [],
        tokens: [
            {
                type,
                standard: 'ERC20',
                contract: '0x5555555555555555555555555555555555555555',
                from,
                to,
                decimals: 6,
                amount,
            },
        ],
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
            phishing: {},
            fetchStatusDetail: {},
        },
        phishing: { dustPhishing: { isEnabled: false, dustThreshold: '0' } },
        fiat: {},
    },
    // Phishing detection on EVM only runs once token definitions are loaded.
    tokenDefinitions: { eth: {} } as unknown as TokenDefinitionsState,
});

describe(selectAccountRecipientHistory.name, () => {
    it('builds the history from the account transactions', () => {
        const state = getRecipientHistoryState(ethAccount, [
            getTransaction({ from: OWN, to: LEGIT }),
        ]);

        const history = selectAccountRecipientHistory(state as never, ethAccount.key);

        expect(history?.sentTo.has(LEGIT)).toBe(true);
    });

    it('keeps counterparties of transactions flagged as phishing apart from the others', () => {
        const state = getRecipientHistoryState(ethAccount, [
            getTransaction({ from: OWN, to: LEGIT }),
            getTransaction({ from: DUSTER, to: OWN, type: 'recv', amount: '0' }),
        ]);

        const history = selectAccountRecipientHistory(state as never, ethAccount.key);

        expect(history?.counterparties.has(DUSTER)).toBe(false);
        expect(history?.phishingCounterparties.has(DUSTER)).toBe(true);
    });

    it('keeps the history when only the account balance changes', () => {
        const state = getRecipientHistoryState(ethAccount, [
            getTransaction({ from: OWN, to: LEGIT }),
        ]);
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
                getRecipientHistoryState(btcAccount, [
                    getTransaction({ from: OWN, to: LEGIT }),
                ]) as never,
                btcAccount.key,
            ),
        ).toBeUndefined();
    });
});
