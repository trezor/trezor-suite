import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAccountTransaction, asAccountDescriptor } from '@suite-common/wallet-types';
import { EVERSTAKE_CONTRACTS, EVERSTAKE_SELECTORS } from '@trezor/network-ethereum/staking';

import {
    classifyEthereumInternalTransfer,
    classifyEthereumStakingCalldata,
    classifyEthereumStakingTransaction,
    findChangedEthereumStakingInternalTransfer,
    isEthereumInternalTransferHidden,
} from './ethereumStakingTransactions';
import { getChangedInternalTxFixture } from './providers/everstake/__fixtures__/everstake';
import { buildStakeData } from './providers/everstake/everstakeCalldata';
import { STAKE_GAS_LIMIT_RESERVE } from './providers/everstake/everstakeConstants';

const ethSymbol = asNetworkSymbol('eth');
const account = { descriptor: asAccountDescriptor('0xMyAddress'), symbol: ethSymbol };

type EthereumSpecificFixture = Partial<NonNullable<WalletAccountTransaction['ethereumSpecific']>>;

const transaction = (
    symbol: WalletAccountTransaction['symbol'],
    ethereumSpecific?: EthereumSpecificFixture,
): WalletAccountTransaction =>
    ({ symbol, ethereumSpecific }) as unknown as WalletAccountTransaction;

describe(classifyEthereumStakingTransaction.name, () => {
    it('asks the providers of the transaction network', () => {
        expect(
            classifyEthereumStakingTransaction(
                transaction(ethSymbol, {
                    parsedData: { methodId: EVERSTAKE_SELECTORS.stake, name: 'stake' },
                }),
            ),
        ).toEqual({ providerId: 'everstake', type: 'stake', gasReserve: STAKE_GAS_LIMIT_RESERVE });
    });

    it('is null for networks without staking providers and for non-staking calls', () => {
        expect(
            classifyEthereumStakingTransaction(
                transaction(asNetworkSymbol('pol'), {
                    parsedData: { methodId: EVERSTAKE_SELECTORS.stake, name: 'stake' },
                }),
            ),
        ).toBeNull();
        expect(classifyEthereumStakingTransaction(transaction(ethSymbol))).toBeNull();
        expect(classifyEthereumStakingTransaction(transaction(asNetworkSymbol('btc')))).toBeNull();
    });
});

describe(classifyEthereumStakingCalldata.name, () => {
    it('classifies draft calldata for the network', () => {
        expect(classifyEthereumStakingCalldata(ethSymbol, buildStakeData())?.gasReserve).toBe(
            STAKE_GAS_LIMIT_RESERVE,
        );
        expect(
            classifyEthereumStakingCalldata(asNetworkSymbol('pol'), buildStakeData()),
        ).toBeNull();
        expect(classifyEthereumStakingCalldata(ethSymbol, undefined)).toBeNull();
    });
});

describe(classifyEthereumInternalTransfer.name, () => {
    const { pool, withdrawTreasury } = EVERSTAKE_CONTRACTS[1];

    it('names the provider of an instant operation', () => {
        expect(
            classifyEthereumInternalTransfer({ from: pool, to: withdrawTreasury }, account),
        ).toEqual({ providerId: 'everstake', type: 'stake' });
        expect(
            classifyEthereumInternalTransfer({ from: pool, to: account.descriptor }, account),
        ).toEqual({ providerId: 'everstake', type: 'unstake' });
    });

    it('hides only instant stakes from the targets', () => {
        expect(
            isEthereumInternalTransferHidden({ from: pool, to: withdrawTreasury }, account),
        ).toBe(true);
        expect(
            isEthereumInternalTransferHidden({ from: pool, to: account.descriptor }, account),
        ).toBe(false);
        expect(isEthereumInternalTransferHidden({ from: '0xA', to: '0xB' }, account)).toBe(false);
    });
});

describe(findChangedEthereumStakingInternalTransfer.name, () => {
    getChangedInternalTxFixture.forEach(test => {
        it(test.description, () => {
            const result =
                test.args.selectedAccountAddress && test.args.symbol
                    ? findChangedEthereumStakingInternalTransfer(
                          test.args.prevTxs as unknown as WalletAccountTransaction[],
                          test.args.currentTxs as unknown as WalletAccountTransaction[],
                          {
                              descriptor: asAccountDescriptor(test.args.selectedAccountAddress),
                              symbol: asNetworkSymbol(test.args.symbol),
                          },
                      )
                    : null;
            expect(result).toEqual(test.result);
        });
    });
});
