/**
 * @jest-environment node
 */
import {
    DisplayFormatAbiTuple,
    DisplayFormatRejectedError,
    createDisplayFormatPathWalker,
    getDisplayFormatSubcalls,
    hexToDisplayFormatBytes,
    parseDisplayFormatCalldata,
} from './ethereumDisplayFormat';
import { mockEthereumDisplayFormatField } from '../../mocks';
import type {
    EthereumDisplayFormatAbiValue,
    EthereumDisplayFormatField,
} from '../types/api/ethereum/displayFormat';

const ADDRESS: EthereumDisplayFormatAbiValue = { type: 'atomic', abiType: 'ABI_ADDRESS' };
const BOOL: EthereumDisplayFormatAbiValue = { type: 'atomic', abiType: 'ABI_BOOL' };
const UINT8: EthereumDisplayFormatAbiValue = { type: 'atomic', abiType: 'ABI_UINT8' };
const UINT256: EthereumDisplayFormatAbiValue = { type: 'atomic', abiType: 'ABI_UINT256' };
const INT160: EthereumDisplayFormatAbiValue = { type: 'atomic', abiType: 'ABI_INT160' };
const BYTES4: EthereumDisplayFormatAbiValue = { type: 'atomic', abiType: 'ABI_BYTES4' };
const BYTES: EthereumDisplayFormatAbiValue = { type: 'dynamic', abiType: 'ABI_BYTES' };
const STRING: EthereumDisplayFormatAbiValue = { type: 'dynamic', abiType: 'ABI_STRING' };

const RECIPIENT = '000000000000000000000000000000000000dead';
const TOKEN = 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

const bytes = (hex: string) => hexToDisplayFormatBytes(hex)!;
const word = (value: bigint | number | string) =>
    typeof value === 'string' ? value.padStart(64, '0') : value.toString(16).padStart(64, '0');
const leftWord = (hex: string) => hex.padEnd(64, '0');
// Length word followed by the content, right-padded to whole words.
const dynamic = (hex: string) =>
    word(hex.length / 2) + hex.padEnd(Math.ceil(hex.length / 64) * 64, '0');
const parse = (definitions: EthereumDisplayFormatAbiValue[], ...words: string[]) =>
    parseDisplayFormatCalldata(definitions, bytes(words.join('')));

describe(parseDisplayFormatCalldata.name, () => {
    it('parses static values', () => {
        expect(
            parse(
                [ADDRESS, BOOL, UINT8, INT160, BYTES4],
                word(RECIPIENT),
                word(1),
                word(255),
                'f'.repeat(64),
                leftWord('12345678'),
            ),
        ).toEqual([bytes(RECIPIENT), true, 255n, -1n, bytes('12345678')]);
    });

    it('takes a top-level tuple as static when the definition says so, as firmware < 2.13.0', () => {
        const tuple: EthereumDisplayFormatAbiValue = {
            type: 'tuple',
            fields: [UINT256, STRING],
            isDynamic: false,
        };
        // Read in place: the uint, then the offset of the string, relative to the tuple.
        const words = [word(7), word(0x40), dynamic(Buffer.from('ok').toString('hex'))];

        expect(
            parseDisplayFormatCalldata([tuple], bytes(words.join('')), {
                isTupleFlagTrusted: true,
            }),
        ).toEqual([new DisplayFormatAbiTuple([7n, 'ok'])]);
        // Firmware 2.13.0 derives it from the fields and reads the tuple through an offset.
        expect(() => parseDisplayFormatCalldata([tuple], bytes(words.join('')))).toThrow(
            DisplayFormatRejectedError,
        );
    });

    it('parses dynamic values after the static head', () => {
        const note = Buffer.from('Žluťoučký kůň').toString('hex');

        expect(
            parse(
                [BYTES, UINT256, STRING],
                word(0x60),
                word(7),
                word(0xa0),
                dynamic('c0ffee'),
                dynamic(note),
            ),
        ).toEqual([bytes('c0ffee'), 7n, 'Žluťoučký kůň']);
    });

    it('reads offsets inside a dynamic tuple relative to the tuple', () => {
        expect(
            parse(
                [UINT256, { type: 'tuple', fields: [ADDRESS, STRING] }],
                word(1),
                word(0x40),
                // the tuple
                word(RECIPIENT),
                word(0x40),
                dynamic(Buffer.from('memo').toString('hex')),
            ),
        ).toEqual([1n, new DisplayFormatAbiTuple([bytes(RECIPIENT), 'memo'])]);
    });

    it('keeps a static tuple in place', () => {
        expect(
            parse(
                [{ type: 'tuple', fields: [ADDRESS, UINT256] }, BOOL],
                word(RECIPIENT),
                word(5),
                word(0),
            ),
        ).toEqual([new DisplayFormatAbiTuple([bytes(RECIPIENT), 5n]), false]);
    });

    it('parses arrays of dynamic values and nested arrays', () => {
        expect(
            parse(
                [
                    { type: 'array', element: BYTES },
                    { type: 'array', element: { type: 'array', element: UINT256 } },
                ],
                word(0x40),
                word(0x120),
                // bytes[]: offsets relative to the first element
                word(2),
                word(0x40),
                word(0x80),
                dynamic('01'),
                dynamic('0203'),
                // uint256[][]
                word(2),
                word(0x40),
                word(0x80),
                word(1),
                word(1),
                word(2),
                word(2),
                word(3),
            ),
        ).toEqual([
            [bytes('01'), bytes('0203')],
            [[1n], [2n, 3n]],
        ]);
    });

    it('parses an empty array', () => {
        expect(parse([{ type: 'array', element: UINT256 }], word(0x20), word(0))).toEqual([[]]);
    });

    describe('rejects what the device rejects', () => {
        it.each<[string, EthereumDisplayFormatAbiValue, string[], string | RegExp]>([
            [
                'an address with dirty padding',
                ADDRESS,
                [`1${word(RECIPIENT).slice(1)}`],
                'value overflow',
            ],
            ['a bool above one', BOOL, [word(2)], 'value overflow'],
            ['a uint8 above its range', UINT8, [word(256)], 'value overflow'],
            ['an int160 above its range', INT160, [word(1n << 159n)], 'value overflow'],
            [
                'an int160 below its range',
                INT160,
                [`${'f'.repeat(24)}7${'f'.repeat(39)}`],
                'value overflow',
            ],
            ['bytes4 with dirty padding', BYTES4, [`12345678${'0'.repeat(55)}1`], 'value overflow'],
            ['a truncated word', UINT256, ['00'], 'out of bounds'],
            ['an offset past the end', BYTES, [word(64)], 'out of bounds'],
            ['a length past the end', BYTES, [word(32), word(33)], 'out of bounds'],
            [
                'a string that is not UTF-8',
                STRING,
                [word(32), word(1), leftWord('ff')],
                'invalid UTF-8 string',
            ],
            [
                'an array longer than the data',
                { type: 'array', element: UINT256 },
                [word(32), word(2), word(1)],
                'out of bounds',
            ],
        ])('%s', (_name, definition, words, error) => {
            expect(() => parse([definition], ...words)).toThrow(error);
            expect(() => parse([definition], ...words)).toThrow(DisplayFormatRejectedError);
        });

        it('an ABI type this client does not know', () => {
            const definition = {
                type: 'atomic',
                abiType: 42,
            } as unknown as EthereumDisplayFormatAbiValue;

            expect(() => parse([definition], word(0))).toThrow(DisplayFormatRejectedError);
        });

        it('an empty tuple', () => {
            expect(() => parse([{ type: 'tuple', fields: [] }])).toThrow('empty tuple');
        });

        it('more than two nested arrays', () => {
            const definition: EthereumDisplayFormatAbiValue = {
                type: 'array',
                element: { type: 'array', element: { type: 'array', element: UINT256 } },
            };

            expect(() => parse([definition], word(32), word(0))).toThrow('ABI nested too deep');
        });

        it('nesting deeper than the device allows', () => {
            const definition = Array.from({ length: 9 }).reduce<EthereumDisplayFormatAbiValue>(
                field => ({ type: 'tuple', fields: [field] }),
                UINT256,
            );

            expect(() => parse([definition], word(0))).toThrow('ABI nested too deep');
        });
    });
});

describe(hexToDisplayFormatBytes.name, () => {
    it.each(['0xC0ffee', 'c0ffee', ' 0Xc0ffee\n'])('accepts %j', hex => {
        expect(hexToDisplayFormatBytes(hex)).toEqual(Uint8Array.from([0xc0, 0xff, 0xee]));
    });

    it.each(['0xc0ffe', 'transfer', '0x0g'])('rejects %j', hex => {
        expect(hexToDisplayFormatBytes(hex)).toBeUndefined();
    });
});

describe(createDisplayFormatPathWalker.name, () => {
    const parameters = [
        new DisplayFormatAbiTuple([bytes(TOKEN), 1_500_000n]),
        [1n, 2n],
        (1n << 160n) | BigInt(`0x${RECIPIENT}`),
    ];
    const walk = createDisplayFormatPathWalker(parameters, { to: bytes(TOKEN), value: 7n });

    it.each<[string, Parameters<typeof walk>[0], unknown]>([
        ['into a tuple', { type: 'data', steps: [0, 1] }, 1_500_000n],
        ['from the end of an array', { type: 'data', steps: [1, -1] }, 2n],
        ['to a whole array', { type: 'data', steps: [1] }, [1n, 2n]],
        [
            'a slice of an integer, viewed as a 32-byte word',
            { type: 'data', steps: [2], slice: { start: -20 } },
            bytes(RECIPIENT),
        ],
        ['a container', { type: 'container', container: 'VALUE' }, 7n],
        ['a constant', { type: 'const', value: 'Aave v3' }, 'Aave v3'],
    ])('walks %s', (_name, path, expected) => {
        expect(walk(path)).toEqual(expected);
    });

    it.each<[string, Parameters<typeof walk>[0], string]>([
        ['to a tuple', { type: 'data', steps: [0] }, 'path resolves to a tuple'],
        ['past an array', { type: 'data', steps: [1, 2] }, 'index out of range'],
        ['into a number', { type: 'data', steps: [2, 0] }, 'cannot walk into a basic value'],
        ['an empty path', { type: 'data', steps: [] }, 'empty path'],
        ['a container it was not given', { type: 'container', container: 'FROM' }, 'FROM'],
    ])('cannot walk %s', (_name, path, error) => {
        expect(() => walk(path)).toThrow(error);
    });
});

describe(getDisplayFormatSubcalls.name, () => {
    const TRANSFER = 'a9059cbb';
    const transferCall = `${TRANSFER}${word(RECIPIENT)}${word(5)}`;
    const createField = (field: Partial<EthereumDisplayFormatField> = {}) =>
        mockEthereumDisplayFormatField({
            label: 'Call',
            formatter: 'FORMATTER_CALLDATA',
            path: { type: 'data', steps: [1] },
            calleePath: { type: 'data', steps: [0] },
            ...field,
        });
    const walk = (...parameters: Parameters<typeof createDisplayFormatPathWalker>[0]) =>
        createDisplayFormatPathWalker(parameters, { to: bytes(RECIPIENT) });

    it('splits a single call into its selector and arguments', () => {
        expect(
            getDisplayFormatSubcalls(createField(), walk(bytes(TOKEN), bytes(transferCall))),
        ).toEqual([
            {
                index: undefined,
                callee: bytes(TOKEN),
                calldata: bytes(transferCall),
                selector: bytes(TRANSFER),
                arguments: bytes(transferCall.slice(8)),
            },
        ]);
    });

    it('takes the arguments as they are when the field names the selector', () => {
        const [subcall] = getDisplayFormatSubcalls(
            createField({ selector: `0x${TRANSFER}` }),
            walk(bytes(TOKEN), bytes(transferCall.slice(8))),
        );

        expect(subcall).toMatchObject({
            selector: bytes(TRANSFER),
            arguments: bytes(transferCall.slice(8)),
        });
    });

    it('leaves the selector out of calldata too short to hold one', () => {
        const [subcall] = getDisplayFormatSubcalls(
            createField(),
            walk(bytes(TOKEN), bytes('a905')),
        );

        expect(subcall?.selector).toBeUndefined();
    });

    it('numbers the calls of a multicall, sharing one callee', () => {
        const subcalls = getDisplayFormatSubcalls(
            createField(),
            walk(bytes(TOKEN), [bytes(transferCall), bytes(transferCall)]),
        );

        expect(subcalls.map(({ index, callee }) => ({ index, callee }))).toEqual([
            { index: 1, callee: bytes(TOKEN) },
            { index: 2, callee: bytes(TOKEN) },
        ]);
    });

    it('pairs the calls of a multicall with their own callees', () => {
        const subcalls = getDisplayFormatSubcalls(
            createField(),
            walk([bytes(TOKEN), bytes(RECIPIENT)], [bytes(transferCall), bytes(transferCall)]),
        );

        expect(subcalls.map(({ callee }) => callee)).toEqual([bytes(TOKEN), bytes(RECIPIENT)]);
    });

    it('takes the callee from the transaction recipient', () => {
        const [subcall] = getDisplayFormatSubcalls(
            createField({ calleePath: { type: 'container', container: 'TO' } }),
            walk(bytes(TOKEN), bytes(transferCall)),
        );

        expect(subcall?.callee).toEqual(bytes(RECIPIENT));
    });

    it.each<[string, Partial<EthereumDisplayFormatField>, Parameters<typeof walk>, string]>([
        [
            'no callee path',
            { calleePath: undefined },
            [bytes(TOKEN), bytes(transferCall)],
            'callee path',
        ],
        [
            'a selector that is not 4 bytes',
            { selector: '0xa9059c' },
            [bytes(TOKEN), bytes(transferCall)],
            'invalid selector',
        ],
        ['calldata that is not bytes', {}, [bytes(TOKEN), 5n], 'not bytes'],
        [
            'a callee that is not an address',
            {},
            [bytes('a905'), bytes(transferCall)],
            'not an address',
        ],
        [
            'callees that do not pair up with the calls',
            {},
            [[bytes(TOKEN)], [bytes(transferCall), bytes(transferCall)]],
            'do not match',
        ],
    ])('fails the transaction for %s', (_name, field, parameters, error) => {
        expect(() => getDisplayFormatSubcalls(createField(field), walk(...parameters))).toThrow(
            error,
        );
    });
});
