import { type AddressType, addressType } from '../../addressType';
import { stellarValidator } from '../stellar_validator';

type StellarIsAddressValidCase = {
    address: string;
    expected: boolean;
};

type StellarAddressTypeCase = {
    address: string;
    expectedAddressType: AddressType | undefined;
};

const stellarIsAddressValidCases: StellarIsAddressValidCase[] = [
    {
        address: 'GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB',
        expected: true,
    },
    {
        address: 'GB7KKHHVYLDIZEKYJPAJUOTBE5E3NJAXPSDZK7O6O44WR3EBRO5HRPVT',
        expected: true,
    },
    {
        address: 'GD6WVYRVID442Y4JVWFWKWCZKB45UGHJAABBJRS22TUSTWGJYXIUR7N2',
        expected: true,
    },
    {
        address: 'GBCG42WTVWPO4Q6OZCYI3D6ZSTFSJIXIS6INCIUF23L6VN3ADE4337AP',
        expected: true,
    },
    {
        address: 'GDFX463YPLCO2EY7NGFMI7SXWWDQAMASGYZXCG2LATOF3PP5NQIUKBPT',
        expected: true,
    },
    {
        address: 'GBXEODUMM3SJ3QSX2VYUWFU3NRP7BQRC2ERWS7E2LZXDJXL2N66ZQ5PT',
        expected: true,
    },
    {
        address: 'GAJHORKJKDDEPYCD6URDFODV7CVLJ5AAOJKR6PG2VQOLWFQOF3X7XLOG',
        expected: true,
    },
    {
        address: 'GACXQEAXYBEZLBMQ2XETOBRO4P66FZAJENDHOQRYPUIXZIIXLKMZEXBJ',
        expected: true,
    },
    {
        address: 'GDD3XRXU3G4DXHVRUDH7LJM4CD4PDZTVP4QHOO4Q6DELKXUATR657OZV',
        expected: true,
    },
    {
        address: 'GDTYVCTAUQVPKEDZIBWEJGKBQHB4UGGXI2SXXUEW7LXMD4B7MK37CWLJ',
        expected: true,
    },
    {
        address: 'GDC5UWE3G6Z4KYOTET5NOCRIVBKWH7MOCSPZPHF4GHQ6XUDD27ACOACD',
        expected: true,
    },
    {
        address: '',
        expected: false,
    },
    {
        address: '%%@',
        expected: false,
    },
    {
        address: '1A1zP1ePQGefi2DMPTifTL5SLmv7DivfNa',
        expected: false,
    },
    {
        address: 'bd839e4f6fadb293ba580df5dea7814399989983',
        expected: false,
    },
    {
        address: 'SBGWKM3CD4IL47QN6X54N6Y33T3JDNVI6AIJ6CD5IM47HG3IG4O36XCU',
        expected: false,
    },
    {
        address: 'GBPXX0A5N4JYPESHAADMQKBPWZWQDQ64ZV6ZL2S3LAGW4SY7NTCMWIVL',
        expected: false,
    },
    {
        address: 'GCFZB6L25D26RQFDWSSBDEYQ32JHLRMTT44ZYE3DZQUTYOL7WY43PLBG++',
        expected: false,
    },
    {
        address: 'GADE5QJ2TY7S5ZB65Q43DFGWYWCPHIYDJ2326KZGAGBN7AE5UY6JVDRRA',
        expected: false,
    },
    {
        address: 'GB6OWYST45X57HCJY5XWOHDEBULB6XUROWPIKW77L5DSNANBEQGUPADT2',
        expected: false,
    },
    {
        address: 'GB6OWYST45X57HCJY5XWOHDEBULB6XUROWPIKW77L5DSNANBEQGUPADT2T',
        expected: false,
    },
    {
        address: 'GDXIIZTKTLVYCBHURXL2UPMTYXOVNI7BRAEFQCP6EZCY4JLKY4VKFNLT',
        expected: false,
    },
    {
        address: 'SAB5556L5AN5KSR5WF7UOEFDCIODEWEO7H2UR4S5R62DFTQOGLKOVZDY',
        expected: false,
    },
    {
        address: 'gWRYUerEKuz53tstxEuR3NCkiQDcV4wzFHmvLnZmj7PUqxW2wt',
        expected: false,
    },
    {
        address: 'g4VPBPrHZkfE8CsjuG2S4yBQNd455UWmk',
        expected: false,
    },
];

const stellarAddressTypeCases: StellarAddressTypeCase[] = [
    {
        address: 'GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB',
        expectedAddressType: addressType.ADDRESS,
    },
    {
        address: 'SBGWKM3CD4IL47QN6X54N6Y33T3JDNVI6AIJ6CD5IM47HG3IG4O36XCU',
        expectedAddressType: undefined,
    },
];

describe('stellar validator', () => {
    it.each(stellarIsAddressValidCases)('validates address $address', testCase => {
        const { address, expected } = testCase;

        expect(stellarValidator.isAddressValid(address, 'xlm')).toBe(expected);
    });

    it.each(stellarAddressTypeCases)('resolves address type for $address', testCase => {
        const { address, expectedAddressType } = testCase;

        expect(stellarValidator.getAddressType(address, 'xlm')).toBe(expectedAddressType);
    });
});
