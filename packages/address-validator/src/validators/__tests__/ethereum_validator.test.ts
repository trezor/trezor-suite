import { type AddressType, addressType } from '../../addressType';
import { type NetworkSymbol } from '../../networkTypes';
import { ethereumValidator } from '../ethereum_validator';

type EthereumIsAddressValidCase = {
    address: string;
    symbol: NetworkSymbol;
    expected: boolean;
};

type EthereumAddressTypeCase = {
    address: string;
    symbol: NetworkSymbol;
    expectedAddressType: AddressType | undefined;
};

const ethereumIsAddressValidCases: EthereumIsAddressValidCase[] = [
    {
        address: '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF',
        symbol: 'eth',
        expected: true,
    },
    {
        address: '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF',
        symbol: 'etc',
        expected: true,
    },
    {
        address: '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF',
        symbol: 'tsep',
        expected: true,
    },
    {
        address: '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF',
        symbol: 'thod',
        expected: true,
    },
    {
        address: '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF',
        symbol: 'rhc',
        expected: true,
    },
    {
        address: '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF',
        symbol: 'hype',
        expected: true,
    },
    {
        address: '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF0',
        symbol: 'eth',
        expected: false,
    },
    {
        address: '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF0',
        symbol: 'etc',
        expected: false,
    },
    {
        address: '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF0',
        symbol: 'tsep',
        expected: false,
    },
    {
        address: '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF0',
        symbol: 'thod',
        expected: false,
    },
    {
        address: '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF0',
        symbol: 'hype',
        expected: false,
    },
    {
        address: '0xa00354276d2fC74ee91e37D085d35748613f4748',
        symbol: 'eth',
        expected: true,
    },
    {
        address: '0xAff4d6793F584a473348EbA058deb8caad77a288',
        symbol: 'eth',
        expected: true,
    },
    {
        address: '0xc6d9d2cd449a754c494264e1809c50e34d64562b',
        symbol: 'eth',
        expected: true,
    },
    {
        address: '0x52908400098527886E0F7030069857D2E4169EE7',
        symbol: 'eth',
        expected: true,
    },
    {
        address: '0x8617E340B3D01FA5F11F306F4090FD50E238070D',
        symbol: 'eth',
        expected: true,
    },
    {
        address: '0xde709f2102306220921060314715629080e2fb77',
        symbol: 'eth',
        expected: true,
    },
    {
        address: '0x27b1fdb04752bbc536007a920d24acb045561c26',
        symbol: 'eth',
        expected: true,
    },
    {
        address: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        symbol: 'eth',
        expected: true,
    },
    {
        address: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
        symbol: 'eth',
        expected: true,
    },
    {
        address: '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
        symbol: 'eth',
        expected: true,
    },
    {
        address: '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
        symbol: 'eth',
        expected: true,
    },
    {
        address: '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
        symbol: 'etc',
        expected: true,
    },
    {
        address: '0x0590396689ee1d287147e9383fb8dd24532f2006',
        symbol: 'bsc',
        expected: true,
    },
    {
        address: '0x07fc5c2bcaa0fa6bdaa4fff897490312c8f33c27',
        symbol: 'bsc',
        expected: true,
    },
    {
        address: '0x7ae2f5b9e386cd1b50a4550696d957cb4900f03a',
        symbol: 'bsc',
        expected: true,
    },
    {
        address: '0x0000000000000000000000000000000000001000',
        symbol: 'bsc',
        expected: true,
    },
    {
        address: 'bnb1xlvns0n2mxh77mzaspn2hgav4rr4m8eerfju38',
        symbol: 'bsc',
        expected: false,
    },
    {
        address: '6xAff4d6793F584a473348EbA058deb8caad77a288',
        symbol: 'eth',
        expected: false,
    },
    {
        address: '0x02fcd51aAbB814FfFe17908fbc888A8975D839A5',
        symbol: 'eth',
        expected: false,
    },
    {
        address: '0XD1220A0CF47C7B9BE7A2E6BA89F429762E7B9ADB',
        symbol: 'eth',
        expected: false,
    },
    {
        address: 'aFf4d6793f584a473348ebA058deb8caad77a2885',
        symbol: 'eth',
        expected: false,
    },
    {
        address: '0xff4d6793F584a473',
        symbol: 'eth',
        expected: false,
    },
    {
        address: '0x02fcd51aAbB814FfFe17908fbc888A8975D839A5',
        symbol: 'etc',
        expected: false,
    },
    {
        address: '',
        symbol: 'bsc',
        expected: false,
    },
    {
        address: '%%@',
        symbol: 'bsc',
        expected: false,
    },
    {
        address: '1A1zP1ePQGefi2DMPTifTL5SLmv7DivfNa',
        symbol: 'bsc',
        expected: false,
    },
    {
        address: 'bd839e4f6fadb293ba580df5dea7814399989983',
        symbol: 'bsc',
        expected: false,
    },
    {
        address: 'xrb_1f5e4w33ndqbkx4bw5jtp13kp5xghebfxcmw9hdt1f7goid1s4373w6tjdgu',
        symbol: 'bsc',
        expected: false,
    },
    {
        address: 'nano_1f5e4w33ndqbkx4bw5jtp13kp5xghebfxcmw9hdt1f7goid1s4373w6tjdgu',
        symbol: 'bsc',
        expected: false,
    },
    {
        address: 'xrb_1111111112111111111111111111111111111111111111111111hifc8npp',
        symbol: 'bsc',
        expected: false,
    },
    {
        address: 'nano_111111111111111111111111111111111111111111111111111hifc8npp',
        symbol: 'bsc',
        expected: false,
    },
];

const ethereumAddressTypeCases: EthereumAddressTypeCase[] = [
    {
        address: '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF',
        symbol: 'eth',
        expectedAddressType: addressType.ADDRESS,
    },
    {
        address: '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
        symbol: 'etc',
        expectedAddressType: addressType.ADDRESS,
    },
    {
        address: '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF',
        symbol: 'hype',
        expectedAddressType: addressType.ADDRESS,
    },
    {
        address: '0x02fcd51aAbB814FfFe17908fbc888A8975D839A5',
        symbol: 'eth',
        expectedAddressType: undefined,
    },
];

describe('ethereum validator', () => {
    it('supports HyperEVM', () => {
        expect(ethereumValidator.getSupportedCoins()).toContain('hype');
    });

    it.each(ethereumIsAddressValidCases)('validates $symbol address $address', testCase => {
        const { address, expected } = testCase;
        const { symbol } = testCase;

        expect(ethereumValidator.isAddressValid(address, symbol)).toBe(expected);
    });

    it.each(ethereumAddressTypeCases)('resolves address type for $address', testCase => {
        const { address, expectedAddressType } = testCase;
        const { symbol } = testCase;

        expect(ethereumValidator.getAddressType(address, symbol)).toBe(expectedAddressType);
    });
});
