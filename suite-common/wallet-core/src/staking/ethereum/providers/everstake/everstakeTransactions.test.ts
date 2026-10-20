import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAccountTransaction, asAccountDescriptor } from '@suite-common/wallet-types';
import { type InternalTransfer } from '@trezor/connect';
import { EVERSTAKE_SELECTORS } from '@trezor/network-ethereum/staking';

import { getInstantStakeTypeFixture } from './__fixtures__/everstake';
import {
    buildClaimWithdrawRequestData,
    buildStakeData,
    buildUnstakeData,
} from './everstakeCalldata';
import { STAKE_GAS_LIMIT_RESERVE } from './everstakeConstants';
import {
    classifyEverstakeCalldata,
    classifyEverstakeInternalTransfer,
    classifyEverstakeTransaction,
} from './everstakeTransactions';

const ethSymbol = asNetworkSymbol('eth');

type EthereumSpecificFixture = Partial<NonNullable<WalletAccountTransaction['ethereumSpecific']>>;

const ethereumTransaction = (
    ethereumSpecific: EthereumSpecificFixture | undefined,
): WalletAccountTransaction =>
    ({ symbol: ethSymbol, ethereumSpecific }) as unknown as WalletAccountTransaction;

describe(classifyEverstakeCalldata.name, () => {
    it('classifies stake, unstake and claim calldata by selector', () => {
        expect(classifyEverstakeCalldata(buildStakeData())).toEqual({
            providerId: 'everstake',
            type: 'stake',
            gasReserve: STAKE_GAS_LIMIT_RESERVE,
        });
        expect(classifyEverstakeCalldata(buildClaimWithdrawRequestData())).toEqual({
            providerId: 'everstake',
            type: 'claim',
            gasReserve: STAKE_GAS_LIMIT_RESERVE,
        });
    });

    it('carries the unstake amount in wei', () => {
        expect(classifyEverstakeCalldata(buildUnstakeData('1500000000000000000', 5))).toEqual({
            providerId: 'everstake',
            type: 'unstake',
            amount: '1500000000000000000',
            gasReserve: STAKE_GAS_LIMIT_RESERVE,
        });
    });

    it('accepts calldata without the 0x prefix and ignores other calls', () => {
        expect(classifyEverstakeCalldata(buildStakeData().slice(2))?.type).toBe('stake');
        expect(classifyEverstakeCalldata('0xa9059cbb')).toBeNull();
        expect(classifyEverstakeCalldata(undefined)).toBeNull();
        expect(classifyEverstakeCalldata('')).toBeNull();
    });
});

describe(classifyEverstakeTransaction.name, () => {
    it('classifies by the parsed selector and decodes the amount from the data', () => {
        const data = buildUnstakeData('2000000000000000000', 5);

        expect(
            classifyEverstakeTransaction(
                ethereumTransaction({
                    parsedData: { methodId: EVERSTAKE_SELECTORS.unstake, name: 'unstake' },
                    data,
                }),
            ),
        ).toEqual({
            providerId: 'everstake',
            type: 'unstake',
            amount: '2000000000000000000',
            gasReserve: STAKE_GAS_LIMIT_RESERVE,
        });
    });

    it('classifies by the parsed selector when the data is missing', () => {
        expect(
            classifyEverstakeTransaction(
                ethereumTransaction({
                    parsedData: { methodId: EVERSTAKE_SELECTORS.unstake, name: 'unstake' },
                }),
            ),
        ).toEqual({
            providerId: 'everstake',
            type: 'unstake',
            gasReserve: STAKE_GAS_LIMIT_RESERVE,
        });
    });

    it('falls back to the raw data when the backend did not parse the selector', () => {
        expect(
            classifyEverstakeTransaction(ethereumTransaction({ data: buildStakeData() })),
        ).toMatchObject({
            type: 'stake',
        });
    });

    it('ignores transactions without Ethereum data or with other selectors', () => {
        expect(classifyEverstakeTransaction(ethereumTransaction(undefined))).toBeNull();
        expect(
            classifyEverstakeTransaction(
                ethereumTransaction({ parsedData: { methodId: '0xa9059cbb', name: 'transfer' } }),
            ),
        ).toBeNull();
    });
});

describe(classifyEverstakeInternalTransfer.name, () => {
    getInstantStakeTypeFixture.forEach(test => {
        it(test.description, () => {
            const result =
                test.args.address && test.args.symbol
                    ? classifyEverstakeInternalTransfer(
                          test.args.internalTransfer as InternalTransfer,
                          {
                              descriptor: asAccountDescriptor(test.args.address),
                              symbol: asNetworkSymbol(test.args.symbol),
                          },
                      )
                    : null;
            expect(result).toEqual(test.result);
        });
    });
});
