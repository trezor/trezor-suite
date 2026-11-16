import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { composeTronClaimFeeLevelsThunk } from '../actions/claim/composeClaim';
import { composeTronUnstakeFeeLevelsThunk } from '../actions/unstake/composeUnstake';
import { composeTronVoteFeeLevelsThunk } from '../actions/vote/composeVote';
import { composeTronWithdrawFeeLevelsThunk } from '../actions/withdraw/composeWithdraw';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    default: { tronComposeTransaction: jest.fn() },
}));

const owner = asAccountDescriptor('TVDGpn4hCSzJ5nkHPLetk8KQBtwaTppnkr');
const buildAccount = (availableBalance: string, availableFreeBandwidth = 0) =>
    mockWalletAccount(
        { symbol: asNetworkSymbol('trx'), descriptor: owner, availableBalance },
        {
            networkType: 'tron',
            misc: { tronResources: { availableFreeBandwidth, availableStakedBandwidth: 0 } },
        },
    );

const composers = [
    {
        name: 'unstake',
        compose: (account: Account) =>
            composeTronUnstakeFeeLevelsThunk({ account, amount: '40', resourceType: 'bandwidth' }),
    },
    { name: 'claim', compose: (account: Account) => composeTronClaimFeeLevelsThunk({ account }) },
    {
        name: 'withdraw',
        compose: (account: Account) => composeTronWithdrawFeeLevelsThunk({ account }),
    },
    {
        name: 'vote',
        compose: (account: Account) =>
            composeTronVoteFeeLevelsThunk({ account, allocations: [{ address: owner, count: 1 }] }),
    },
];

describe.each(composers)('Tron $name fee affordability', ({ compose }) => {
    beforeEach(() => {
        jest.mocked(TrezorConnect.tronComposeTransaction).mockResolvedValue({
            success: true,
            payload: {
                bandwidth: 300,
                rawDataHex: '0a00',
                ref_block_bytes: '0001',
                ref_block_hash: '0000000000000000',
                expiration: 1_700_000_060_000,
                timestamp: 1_700_000_000_000,
            },
        });
    });

    it.each(['0', '299999'])(
        'blocks a liquid balance of %s SUN and preserves the estimate',
        async balance => {
            const { dispatch } = createMockDispatch({ getState: () => undefined, extra: {} });
            const result = await dispatch(compose(buildAccount(balance)));

            expect(result.payload).toEqual({
                normal: expect.objectContaining({
                    type: 'error',
                    error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                    estimatedTransaction: expect.objectContaining({
                        type: 'final',
                        fee: '300000',
                        bytes: 300,
                    }),
                }),
            });
        },
    );

    it.each(['300000', '300001'])('accepts a liquid balance of %s SUN', async balance => {
        const { dispatch } = createMockDispatch({ getState: () => undefined, extra: {} });
        const result = await dispatch(compose(buildAccount(balance)));

        expect(result.payload).toEqual({
            normal: expect.objectContaining({ type: 'final', fee: '300000' }),
        });
    });

    it('accepts zero liquid balance when bandwidth covers the transaction', async () => {
        const { dispatch } = createMockDispatch({ getState: () => undefined, extra: {} });
        const result = await dispatch(compose(buildAccount('0', 600)));

        expect(result.payload).toEqual({
            normal: expect.objectContaining({ type: 'final', fee: '0' }),
        });
    });
});
