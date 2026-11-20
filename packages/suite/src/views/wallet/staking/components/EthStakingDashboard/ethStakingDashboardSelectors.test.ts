import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import { selectAccountInstantStakeTransactions } from './ethStakingDashboardSelectors';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../mocks/mockInitialAppState';

const ETH = asNetworkSymbol('eth');
const ACCOUNT_KEY = mockAccountKey({ symbol: ETH });

const EVERSTAKE_STAKE_METHOD_ID = '0x3a29dbae';
const EVERSTAKE_UNSTAKE_METHOD_ID = '0x76ec871c';
const EVERSTAKE_CLAIM_METHOD_ID = '0x33986ffa';

const everstakeTransaction = (txid: string, methodId: string) =>
    testMocks.getWalletTransaction({
        txid,
        symbol: ETH,
        ethereumSpecific: {
            status: 1,
            nonce: 1,
            gasLimit: 21000,
            parsedData: { methodId, name: 'everstake' },
        },
    });

const createState = (transactions: WalletAccountTransaction[]): MockSuiteState => ({
    ...mockInitialAppState,
    wallet: {
        ...mockInitialAppState.wallet,
        transactions: {
            ...mockInitialAppState.wallet.transactions,
            transactions: { [ACCOUNT_KEY]: transactions },
        },
    },
});

describe('selectAccountInstantStakeTransactions', () => {
    it('keeps the stake and unstake transactions, confirmed or not, and leaves the claim out', () => {
        const state = createState([
            everstakeTransaction('stake', EVERSTAKE_STAKE_METHOD_ID),
            everstakeTransaction('claim', EVERSTAKE_CLAIM_METHOD_ID),
            everstakeTransaction('unstake', EVERSTAKE_UNSTAKE_METHOD_ID),
            testMocks.getWalletTransaction({ txid: 'transfer', symbol: ETH }),
        ]);

        expect(
            selectAccountInstantStakeTransactions(state, ACCOUNT_KEY).map(({ txid }) => txid),
        ).toEqual(['stake', 'unstake']);
    });

    it('keeps one empty list for an account without a staking transaction', () => {
        const list = selectAccountInstantStakeTransactions(createState([]), ACCOUNT_KEY);

        expect(list).toEqual([]);
        expect(
            selectAccountInstantStakeTransactions(
                createState([everstakeTransaction('claim', EVERSTAKE_CLAIM_METHOD_ID)]),
                ACCOUNT_KEY,
            ),
        ).toBe(list);
    });
});
