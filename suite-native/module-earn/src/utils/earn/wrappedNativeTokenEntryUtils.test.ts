import { asNetworkSymbol } from '@suite-common/wallet-config';
import { toTokenAddress } from '@suite-common/wallet-types';

import { getWrappedNativeTokenEntries } from './wrappedNativeTokenEntryUtils';

type Params = Parameters<typeof getWrappedNativeTokenEntries>[0];
type EntryTestCase = [
    description: string,
    overrides: Partial<Params>,
    expected: { isDisplayed: boolean; isDisabled: boolean },
];

const ethSymbol = asNetworkSymbol('eth');
const btcSymbol = asNetworkSymbol('btc');
const solSymbol = asNetworkSymbol('sol');

const wethContract = toTokenAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
const otherTokenContract = toTokenAddress('0x0000000000000000000000000000000000000001');

const baseParams: Params = {
    isDebugEnvironment: true,
    isPortfolioTrackerDevice: false,
    isUnwrapDisabled: false,
    isWrapDisabled: false,
    networkType: 'ethereum',
    symbol: ethSymbol,
    tokenContract: undefined,
};

const createParams = (overrides: Partial<Params> = {}): Params => ({
    ...baseParams,
    ...overrides,
});

describe('getWrappedNativeTokenEntries', () => {
    describe('wrap entry', () => {
        it.each([
            ['is displayed and enabled by default', {}, { isDisplayed: true, isDisabled: false }],
            [
                'is hidden outside a debug/develop environment',
                { isDebugEnvironment: false },
                { isDisplayed: false, isDisabled: false },
            ],
            [
                'is hidden when a token contract is selected',
                { tokenContract: otherTokenContract },
                { isDisplayed: false, isDisabled: false },
            ],
            [
                'is hidden for non-Ethereum accounts',
                { networkType: 'bitcoin', symbol: btcSymbol },
                { isDisplayed: false, isDisabled: false },
            ],
            [
                'is hidden for a network without a wrapped-native address',
                { symbol: solSymbol },
                { isDisplayed: false, isDisabled: false },
            ],
            [
                'stays displayed but becomes disabled when the remote config disables wrap',
                { isWrapDisabled: true },
                { isDisplayed: true, isDisabled: true },
            ],
            [
                'is unaffected by isUnwrapDisabled',
                { isUnwrapDisabled: true },
                { isDisplayed: true, isDisabled: false },
            ],
            [
                'is hidden in portfolio-tracker mode',
                { isPortfolioTrackerDevice: true },
                { isDisplayed: false, isDisabled: false },
            ],
        ] as const satisfies EntryTestCase[])('%s', (_description, overrides, expected) => {
            const { wrap } = getWrappedNativeTokenEntries(createParams(overrides));

            expect(wrap).toEqual(expected);
        });
    });

    describe('unwrap entry', () => {
        it.each([
            [
                'is displayed and enabled for the wrapped-native token contract',
                { tokenContract: wethContract },
                { isDisplayed: true, isDisabled: false },
            ],
            [
                'is hidden for another token contract',
                { tokenContract: otherTokenContract },
                { isDisplayed: false, isDisabled: false },
            ],
            [
                'is hidden when no token contract is selected',
                {},
                { isDisplayed: false, isDisabled: false },
            ],
            [
                'is hidden for non-Ethereum accounts',
                { networkType: 'bitcoin', symbol: btcSymbol, tokenContract: wethContract },
                { isDisplayed: false, isDisabled: false },
            ],
            [
                'stays displayed but becomes disabled when the remote config disables unwrap',
                { tokenContract: wethContract, isUnwrapDisabled: true },
                { isDisplayed: true, isDisabled: true },
            ],
            [
                'is unaffected by isDebugEnvironment',
                { tokenContract: wethContract, isDebugEnvironment: false },
                { isDisplayed: true, isDisabled: false },
            ],
            [
                'is unaffected by isWrapDisabled',
                { tokenContract: wethContract, isWrapDisabled: true },
                { isDisplayed: true, isDisabled: false },
            ],
            [
                'is hidden in portfolio-tracker mode',
                { tokenContract: wethContract, isPortfolioTrackerDevice: true },
                { isDisplayed: false, isDisabled: false },
            ],
        ] as const satisfies EntryTestCase[])('%s', (_description, overrides, expected) => {
            const { unwrap } = getWrappedNativeTokenEntries(createParams(overrides));

            expect(unwrap).toEqual(expected);
        });
    });
});
