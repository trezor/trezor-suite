/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
import BigNumber from 'bignumber.js';
import { TrezorError } from '../../../constants/errors';
import { PROTO } from '../../../constants';

export const parseArrayType = [
    {
        description: 'should parse sized arrays',
        input: 'uint8[26]',
        output: {
            entryTypeName: 'uint8',
            arraySize: 26,
        },
    },
    {
        description: 'should parse dynamic arrays',
        input: 'int32[]',
        output: {
            entryTypeName: 'int32',
            arraySize: null,
        },
    },
    {
        // Decode last [] first
        // Can't find an official source, but this is what Metamask's signTypedData_v4 does:
        // https://github.com/MetaMask/eth-sig-util/blob/5f2259463990050606cd58b43e64e4bffcb715f4/src/sign-typed-data.ts#L202-L211
        description: 'should parse nested arrays',
        input: 'int32[5][12]',
        output: {
            entryTypeName: 'int32[5]',
            arraySize: 12,
        },
    },
    {
        description: 'should throw error for non-array type',
        input: 'bytes',
        error: [TrezorError, 'could not be parsed'],
    },
];

export const getFieldType = [
    {
        description: `should parse uints`,
        input: {
            typeName: 'uint256',
            types: {},
        },
        output: {
            data_type: PROTO.EthereumDataType.UINT,
            size: 32,
        },
    },
    {
        description: `should parse ints`,
        input: {
            typeName: 'int8',
            types: {},
        },
        output: {
            data_type: PROTO.EthereumDataType.INT,
            size: 1,
        },
    },
    {
        description: `should parse booleans`,
        input: {
            typeName: 'bool',
            types: {},
        },
        output: {
            data_type: PROTO.EthereumDataType.BOOL,
        },
    },
    {
        description: `should parse address`,
        input: {
            typeName: 'address',
            types: {},
        },
        output: {
            data_type: PROTO.EthereumDataType.ADDRESS,
        },
    },
    {
        description: `should parse dynamic bytes`,
        input: {
            typeName: 'bytes',
            types: {},
        },
        output: {
            data_type: PROTO.EthereumDataType.BYTES,
            size: undefined,
        },
    },
    {
        description: `should parse fixed-size bytes`,
        input: {
            typeName: 'bytes18',
            types: {},
        },
        output: {
            data_type: PROTO.EthereumDataType.BYTES,
            size: 18,
        },
    },
    {
        description: `should parse array types`,
        input: {
            typeName: 'uint256[57]',
            types: {},
        },
        output: {
            data_type: PROTO.EthereumDataType.ARRAY,
            size: 57,
            entry_type: {
                data_type: PROTO.EthereumDataType.UINT,
                size: 32,
            },
        },
    },
    {
        description: `should parse dynamic array types`,
        input: {
            typeName: 'uint256[]',
            types: {},
        },
        output: {
            data_type: PROTO.EthereumDataType.ARRAY,
            size: undefined,
            entry_type: {
                data_type: PROTO.EthereumDataType.UINT,
                size: 32,
            },
        },
    },
    {
        // Unsupported in Trezor firmware as of v2.4.3
        description: 'should parse nested arrays',
        input: {
            typeName: 'int32[5][12]',
            types: {},
        },
        output: {
            data_type: PROTO.EthereumDataType.ARRAY,
            size: 12,
            entry_type: {
                data_type: PROTO.EthereumDataType.ARRAY,
                size: 5,
                entry_type: {
                    data_type: PROTO.EthereumDataType.INT,
                    size: 4,
                },
            },
        },
    },
    {
        description: `should parse Struct types`,
        input: {
            typeName: 'ExampleStruct',
            types: {
                ExampleStruct: [
                    { name: 'message', type: 'string' },
                    { name: 'cost', type: 'int8' },
                ],
            },
        },
        output: {
            data_type: PROTO.EthereumDataType.STRUCT,
            size: 2,
            struct_name: 'ExampleStruct',
        },
    },
    {
        description: `should throw if Struct type not defined`,
        input: {
            typeName: 'MissingType',
            types: {
                // empty
            },
        },
        error: [TrezorError, 'No type definition specified: MissingType'],
    },
];

export const encodeData = [
    {
        description: 'should remove leading `0x` from byte hex-string',
        input: {
            typeName: 'bytes',
            data: '0x0123456789abcdef',
        },
        output: '0123456789abcdef',
    },
    {
        description: 'should pad hex to nearest byte',
        input: {
            typeName: 'bytes',
            data: '0x1',
        },
        output: '01',
    },
    {
        description: 'should encode bytes from Buffer',
        // Required for MetaMask compatability
        input: {
            typeName: 'bytes',
            data: Buffer.from('0123456789abcdef', 'hex'),
        },
        output: '0123456789abcdef',
    },
    {
        description: 'should encode bytes from ArrayBuffer',
        input: {
            typeName: 'bytes',
            data: new Uint8Array([0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef]).buffer,
        },
        output: '0123456789abcdef',
    },
    {
        description: 'should remove leading `0x` from Ethereum address',
        input: {
            typeName: 'address',
            data: '0x000000000000000000000000000000000000dead',
        },
        output: '000000000000000000000000000000000000dead',
    },
    // INTEGER CONVERSIONS
    {
        description: `should encode unsigned integers`,
        input: {
            typeName: 'uint8',
            data: 255,
        },
        output: 'ff',
    },
    {
        description: `should encode positive signed integers`,
        input: {
            typeName: 'int8',
            data: 127,
        },
        output: '7f',
    },
    {
        description: `should encode negative signed integers`,
        input: {
            typeName: 'int8',
            data: -1,
        },
        output: 'ff',
    },
    {
        description: `should encode int from bigint`,
        input: {
            typeName: 'int256',
            // `1n << 254n` instead of `2n ** 254n` since Babel replaces ** with Math.pow()
            // @ts-ignore, BigInt literals are not available when targeting lower than ES2020
            data: -(1n << 254n) + 1n,
        },
        // Python (-(2 ** 254) + 1).to_bytes(32, "big", signed=True).hex()
        output: 'c000000000000000000000000000000000000000000000000000000000000001',
    },
    {
        description: `should encode int from string`,
        input: {
            typeName: 'int256',
            // @ts-ignore, BigInt literals are not available when targeting lower than ES2020
            data: `${-(1n << 254n) + 1n}`,
        },
        // Python (-(2 ** 254) + 1).to_bytes(32, "big", signed=True).hex()
        output: 'c000000000000000000000000000000000000000000000000000000000000001',
    },
    {
        description: `should encode int from BigNumber`,
        input: {
            typeName: 'int256',
            data: new BigNumber(2).pow(254).negated().plus(1),
        },
        // Python (-(2 ** 254) + 1).to_bytes(32, "big", signed=True).hex()
        output: 'c000000000000000000000000000000000000000000000000000000000000001',
    },
    {
        description: `should encode uint from hex-string`,
        input: {
            typeName: 'uint256',
            data: '0xc000000000000000000000000000000000000000000000000000000000000001',
        },
        output: 'c000000000000000000000000000000000000000000000000000000000000001',
    },
    {
        description: `should throw overflow error when signed int is too large`,
        input: {
            typeName: 'int8',
            data: 128,
        },
        error: [TrezorError, 'overflow'],
    },
    {
        description: `should throw overflow error when signed int is too small`,
        input: {
            typeName: 'int8',
            data: -129,
        },
        error: [TrezorError, 'overflow'],
    },
    {
        description: `should throw overflow error when unsigned int is too large`,
        input: {
            typeName: 'uint8',
            data: 256,
        },
        error: [TrezorError, 'overflow'],
    },
    {
        description: `should throw error when unsigned int is negative`,
        input: {
            typeName: 'uint8',
            data: -1,
        },
        error: [TrezorError, 'negative'],
    },
    {
        description: 'should encode string as utf-8',
        input: {
            typeName: 'string',
            data: 'TT is an amazing piece of hardware. 😋😋',
        },
        output: '545420697320616e20616d617a696e67207069656365206f662068617264776172652e20f09f988bf09f988b',
    },
    {
        description: 'should encode bool as a single byte',
        input: {
            typeName: 'bool',
            data: true,
        },
        output: '01',
    },
    {
        description: 'should encode bool as a single byte',
        input: {
            typeName: 'bool',
            data: false,
        },
        output: '00',
    },
    {
        description: 'should throw for array types',
        input: {
            typeName: 'bool[1]',
            data: [true],
        },
        error: [TrezorError, 'Unsupported'],
    },
];
