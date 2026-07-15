import { type AddressType, addressType } from '../../addressType';
import { type NetworkSymbol } from '../../networkTypes';
import { tronValidator } from '../tron_validator';

type TronIsAddressValidCase = {
    address: string;
    symbol: NetworkSymbol;
    expected: boolean;
};

type TronAddressTypeCase = {
    address: string;
    symbol: NetworkSymbol;
    expectedAddressType: AddressType | undefined;
};

const tronIsAddressValidCases: TronIsAddressValidCase[] = [
    {
        address: 'TNDzfERDpxLDS2w1q6yaFC7pzqaSQ3Bg3r',
        symbol: 'trx',
        expected: true,
    },
    {
        address: 'TNDzfERDpxLDS2w1q6yaFC7pzqaSQ3Bg3r',
        symbol: 'ttrx',
        expected: true,
    },
    {
        address: 'TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz4',
        symbol: 'trx',
        expected: true,
    },
    {
        address: 'TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz4',
        symbol: 'ttrx',
        expected: true,
    },
    {
        address: 'TNXoiAJ3dct8Fjg4M9fkLFh9S2v9TXc32G',
        symbol: 'trx',
        expected: true,
    },
    {
        address: '',
        symbol: 'trx',
        expected: false,
    },
    {
        address: '%%@',
        symbol: 'trx',
        expected: false,
    },
    {
        address: '1A1zP1ePQGefi2DMPTifTL5SLmv7DivfNa',
        symbol: 'trx',
        expected: false,
    },
    {
        address: 'bd839e4f6fadb293ba580df5dea7814399989983',
        symbol: 'trx',
        expected: false,
    },
    {
        address: 'xrb_1111111112111111111111111111111111111111111111111111hifc8npp',
        symbol: 'trx',
        expected: false,
    },
    {
        address: 'TNDzfERDpxLDS2w1q6yaFC7pzqaSQ3Bg31',
        symbol: 'trx',
        expected: false,
    },
    {
        address: 'TNDzfERDpxLDS2w1q6yaFC7pzqaSQ3Bg31',
        symbol: 'ttrx',
        expected: false,
    },
];

const tronAddressTypeCases: TronAddressTypeCase[] = [
    {
        address: 'TNXoiAJ3dct8Fjg4M9fkLFh9S2v9TXc32G',
        symbol: 'trx',
        expectedAddressType: addressType.ADDRESS,
    },
    {
        address: 'TNDzfERDpxLDS2w1q6yaFC7pzqaSQ3Bg31',
        symbol: 'trx',
        expectedAddressType: undefined,
    },
];

describe('tron validator', () => {
    it.each(tronIsAddressValidCases)('validates $symbol address $address', testCase => {
        const { address, expected, symbol } = testCase;

        expect(tronValidator.isAddressValid(address, symbol)).toBe(expected);
    });

    it.each(tronAddressTypeCases)(
        'resolves address type for $symbol address $address',
        testCase => {
            const { address, expectedAddressType, symbol } = testCase;

            expect(tronValidator.getAddressType(address, symbol)).toBe(expectedAddressType);
        },
    );
});
