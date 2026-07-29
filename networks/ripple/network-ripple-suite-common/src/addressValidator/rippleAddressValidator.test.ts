import { type AddressType, addressType } from '@trezor/network-module-suite-common-types';

import type { RippleNetworkSymbol } from '../supportedNetworks';
import { rippleValidator } from './rippleAddressValidator';

type RippleIsAddressValidCase = {
    address: string;
    symbol: RippleNetworkSymbol;
    expected: boolean;
};

type RippleAddressTypeCase = {
    address: string;
    symbol: RippleNetworkSymbol;
    expectedAddressType: AddressType | undefined;
};

const rippleIsAddressValidCases: RippleIsAddressValidCase[] = [
    {
        address: 'rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn',
        symbol: 'xrp',
        expected: true,
    },
    {
        address: 'rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn',
        symbol: 'txrp',
        expected: true,
    },
    {
        address: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
        symbol: 'xrp',
        expected: true,
    },
    {
        address: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
        symbol: 'xrp',
        expected: true,
    },
    {
        address: 'rDTXLQ7ZKZVKz33zJbHjgVShjsBnqMBhmN',
        symbol: 'xrp',
        expected: true,
    },
    {
        address: 'rDTXLQ7ZKZVKz33zJbHjgVShjsBnqMBhmN',
        symbol: 'txrp',
        expected: true,
    },
    {
        address: 'rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCN',
        symbol: 'xrp',
        expected: false,
    },
    {
        address: 'rDTXLQ7ZKZVKz33zJbHjgVShjsBnqMBhMN',
        symbol: 'xrp',
        expected: false,
    },
    {
        address: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV0',
        symbol: 'xrp',
        expected: false,
    },
    {
        address: '6xAff4d6793F584a473348EbA058deb8ca',
        symbol: 'xrp',
        expected: false,
    },
    {
        address: 'DJ53hTyLBdZp2wMi5BsCS3rtEL1ioYUkva',
        symbol: 'xrp',
        expected: false,
    },
];

const rippleAddressTypeCases: RippleAddressTypeCase[] = [
    {
        address: 'rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn',
        symbol: 'xrp',
        expectedAddressType: addressType.ADDRESS,
    },
    {
        address: 'rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCN',
        symbol: 'xrp',
        expectedAddressType: undefined,
    },
];

describe('ripple validator', () => {
    it.each(rippleIsAddressValidCases)('validates $symbol address $address', testCase => {
        const { address, expected, symbol } = testCase;

        expect(rippleValidator.isAddressValid(address, symbol)).toBe(expected);
    });

    it.each(rippleAddressTypeCases)(
        'resolves address type for $symbol address $address',
        testCase => {
            const { address, expectedAddressType, symbol } = testCase;

            expect(rippleValidator.getAddressType(address, symbol)).toBe(expectedAddressType);
        },
    );
});
