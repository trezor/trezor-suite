import { type AddressType, addressType } from '../../addressType';
import { adaValidator } from '../ada_validator';

type CardanoIsAddressValidCase = {
    address: string;
    expected: boolean;
};

type CardanoAddressTypeCase = {
    address: string;
    expectedAddressType: AddressType | undefined;
};

const cardanoIsAddressValidCases: CardanoIsAddressValidCase[] = [
    {
        address: 'Ae2tdPwUPEYxYNJw1He1esdZYvjmr4NtPzUsGTiqL9zd8ohjZYQcwu6kom7',
        expected: true,
    },
    {
        address:
            'DdzFFzCqrhsfdzUZxvuBkhV8Lpm9p43p9ubh79GCTkxJikAjKh51qhtCFMqUniC5tv5ZExyvSmAte2Du2tGimavSo6qSgXbjiy8qZRTg',
        expected: true,
    },
    {
        address: 'Ae2tdPwUPEZKmwoy3AU3cXb5Chnasj6mvVNxV1H11997q3VW5ihbSfQwGpm',
        expected: true,
    },
    {
        address:
            '4swhHtxKapQbj3TZEipgtp7NQzcRWDYqCxXYoPQWjGyHmhxS1w1TjUEszCQT1sQucGwmPQMYdv1FYs3d51KgoubviPBf',
        expected: true,
    },
    {
        address:
            'addr1qxnv5u3vrx2t37h3u27qd5ukgcjmrl4f8mu9f5sza3h20cxsfjh80un9kvlggfcdw8fp5kqp9tztqnee9msd0qsafhdsyqclvk',
        expected: true,
    },
    {
        address:
            'ADDR1QXNV5U3VRX2T37H3U27QD5UKGCJMRL4F8MU9F5SZA3H20CXSFJH80UN9KVLGGFCDW8FP5KQP9TZTQNEE9MSD0QSAFHDSYQCLVK',
        expected: true,
    },
    {
        address:
            'addr1qxclz0u9guazk70l9vv3xf67wx3psx3dekasvy43xfvz56qcs6f7ssw2x0fcesudyj8h224rnzkae2lqlnw8f3353t3sjggfx0',
        expected: true,
    },
    {
        address:
            'addr_test1qru5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usqd9a9q',
        expected: true,
    },
    {
        address: 'stake1uya87zwnmax0v6nnn8ptqkl6ydx4522kpsc3l3wmf3yswygwx45el',
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
        address: 'Ae2tdPwUPEYxYNJw1He1esdZYvjmr4NtPzUsGTiqL9zd8ohjZYQcwu6lom7',
        expected: false,
    },
    {
        address:
            'DdzFFzCqrhsfdzUZxvuBkhV8Lpm9p43p9ubh79GCTkxJikAjKh51qhtCFMqUniC5tv5ZExyvSmAte2Du2tGimavSo6qSgXbjiy8qZRTg1',
        expected: false,
    },
    {
        address:
            'DdzFFzCqrhsfdzUZxvuBkhV8Lpm9p43p9ubh79GCTkxJikAjKh51qhtCFMqUniC5tv5ZExyvSmAte2Du2tGimavSo6qSgXbjiy8qZRT',
        expected: false,
    },
    {
        address:
            'ADDR1qXNV5U3VRX2T37H3U27QD5UKGCJMRL4F8MU9F5SZA3H20CXSFJH80UN9KVLGGFCDW8FP5KQP9TZTQNEE9MSD0QSAFHDSYQCLVK',
        expected: false,
    },
    {
        address:
            'addr1qxnv5u3vrx2t37h3u27qd5ukgcjmrl4f8mu9f5sza3h20cxsfjh80un9kvlggfcdw8fp5kqp9tztqnee9msd0qsafhdsyqclvl',
        expected: false,
    },
    {
        address: '2',
        expected: false,
    },
    {
        address: 'kkVd',
        expected: false,
    },
    {
        address: '5yWKF5vph3',
        expected: false,
    },
    {
        address: 'kzKq',
        expected: false,
    },
    {
        address: 'notacardanoaddress',
        expected: false,
    },
];

const cardanoAddressTypeCases: CardanoAddressTypeCase[] = [
    {
        address: 'Ae2tdPwUPEYxYNJw1He1esdZYvjmr4NtPzUsGTiqL9zd8ohjZYQcwu6kom7',
        expectedAddressType: addressType.ADDRESS,
    },
    {
        address:
            'addr_test1qru5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usqd9a9q',
        expectedAddressType: addressType.ADDRESS,
    },
    {
        address: 'notacardanoaddress',
        expectedAddressType: undefined,
    },
];

describe('cardano validator', () => {
    it.each(cardanoIsAddressValidCases)('validates address $address', testCase => {
        const { address, expected } = testCase;

        expect(adaValidator.isAddressValid(address, 'ada')).toBe(expected);
    });

    it.each(cardanoAddressTypeCases)('resolves address type for $address', testCase => {
        const { address, expectedAddressType } = testCase;

        expect(adaValidator.getAddressType(address, 'ada')).toBe(expectedAddressType);
    });
});
