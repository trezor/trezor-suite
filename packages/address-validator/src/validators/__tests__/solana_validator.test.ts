import { type AddressType, addressType } from '../../addressType';
import { solanaValidator } from '../solana_validator';

type SolanaIsAddressValidCase = {
    address: string;
    expected: boolean;
};

type SolanaAddressTypeCase = {
    address: string;
    expectedAddressType: AddressType | undefined;
};

const solanaIsAddressValidCases: SolanaIsAddressValidCase[] = [
    {
        address: '64duFXLEMcVaZpm4SRmtqEdSQ5LFht22hK1SLu2ayU9b',
        expected: true,
    },
    {
        address: 'DkMYphwx9Z9AdR5Y8M4md1H96TKxfyoAHxUYH56F4ij5',
        expected: true,
    },
    {
        address: 'CN2JT7qJ84aVUMtSGuNSte5ytP5eMeeHgTVzyBiHDxMr',
        expected: true,
    },
    {
        address: 'H22WwH3qSAbZ6fH1n9PzGso3vBwQUz7gmK827ijLTgJW',
        expected: true,
    },
    {
        address: 'sol_123456',
        expected: false,
    },
    {
        address: '65udFxlkjm1xfyo',
        expected: false,
    },
    {
        address:
            'CN2JT7qJ84aVUMtSGuNSte5ytP5eMeeHgTVzyBiHDxMrH22WwH3qSAbZ6fH1n9PzGso3vBwQUz7gmK827ijLTgJW',
        expected: false,
    },
];

const solanaAddressTypeCases: SolanaAddressTypeCase[] = [
    {
        address: '64duFXLEMcVaZpm4SRmtqEdSQ5LFht22hK1SLu2ayU9b',
        expectedAddressType: addressType.ADDRESS,
    },
    {
        address: 'sol_123456',
        expectedAddressType: undefined,
    },
];

describe('solana validator', () => {
    it.each(solanaIsAddressValidCases)('validates address $address', testCase => {
        const { address, expected } = testCase;

        expect(solanaValidator.isAddressValid(address, 'sol')).toBe(expected);
    });

    it.each(solanaAddressTypeCases)('resolves address type for $address', testCase => {
        const { address, expectedAddressType } = testCase;

        expect(solanaValidator.getAddressType(address, 'sol')).toBe(expectedAddressType);
    });
});
