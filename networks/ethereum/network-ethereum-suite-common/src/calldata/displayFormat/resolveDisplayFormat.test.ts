import { type Abi, encodeFunctionData, getAddress, parseAbi, toFunctionSelector } from 'viem';

import type {
    EthereumDisplayFormat,
    EthereumDisplayFormatAbiValue,
    EthereumDisplayFormatField,
} from '@trezor/connect-common';
import {
    mockEthereumDisplayFormatField as createField,
    mockEthereumDisplayFormat,
} from '@trezor/connect-common/mocks';

import { type ResolveDisplayFormatOptions, resolveDisplayFormat } from './resolveDisplayFormat';

const FROM = getAddress('0x9c8e4d2bb3a6e5d7a3f0d1e0f84e3b1c2a7d6e5f');
const FROM_PATH = "m/44'/60'/0'/0/0";
const POOL = getAddress('0x721b9abab6511b46b9ee83a1aba23bdacb004149');
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const RECIPIENT = '0x000000000000000000000000000000000000dEaD';

const ADDRESS: EthereumDisplayFormatAbiValue = { type: 'atomic', abiType: 'ABI_ADDRESS' };
const UINT256: EthereumDisplayFormatAbiValue = { type: 'atomic', abiType: 'ABI_UINT256' };

const OPTIONS: ResolveDisplayFormatOptions = { firmwareVersion: '2.13.1' };

const createDisplayFormat = (
    signature: string,
    format: Pick<EthereumDisplayFormat, 'parameters' | 'fields'> & Partial<EthereumDisplayFormat>,
): EthereumDisplayFormat =>
    mockEthereumDisplayFormat({
        chainId: 100,
        address: POOL.toLowerCase(),
        functionSignature: toFunctionSelector(signature),
        ...format,
    });

describe(resolveDisplayFormat.name, () => {
    const depositEth = 'function depositETH(address pool, address onBehalfOf, uint16 referralCode)';
    const depositEthFormat = createDisplayFormat(depositEth, {
        parameters: [ADDRESS, ADDRESS, { type: 'atomic', abiType: 'ABI_UINT16' }],
        fields: [
            createField({
                label: 'Amount to supply',
                formatter: 'FORMATTER_AMOUNT',
                path: { type: 'container', container: 'VALUE' },
            }),
            createField({
                label: 'Collateral recipient',
                formatter: 'FORMATTER_ADDRESS_NAME',
                path: { type: 'data', steps: [1] },
            }),
        ],
    });
    const depositEthData = encodeFunctionData({
        abi: parseAbi([depositEth]),
        args: [POOL, FROM, 0],
    });

    it('resolves the Aave depositETH call the device clear-signs', () => {
        expect(
            resolveDisplayFormat(
                depositEthFormat,
                { fromPath: FROM_PATH, to: POOL, value: 10n ** 18n, data: depositEthData },
                OPTIONS,
            ),
        ).toEqual({
            contractAddress: POOL,
            providerName: 'Aave',
            intent: 'Supply',
            rows: [
                {
                    type: 'field',
                    label: 'Amount to supply',
                    values: [{ type: 'nativeAmount', amount: '1000000000000000000' }],
                },
                {
                    type: 'field',
                    label: 'Collateral recipient',
                    values: [{ type: 'address', address: FROM }],
                },
            ],
        });
    });

    it.each([
        ['another function', `0x12345678${depositEthData.slice(10)}`],
        ['truncated calldata', depositEthData.slice(0, -2)],
        // The device rejects an address word whose padding is not zero.
        ['a dirty address', depositEthData.replace(/0{24}9c8e4d2b/i, `${'0'.repeat(23)}19c8e4d2b`)],
        ['a uint16 out of range', `${depositEthData.slice(0, -64)}${'0'.repeat(59)}10000`],
        ['data that is not hex', 'transfer'],
        ['hex with an odd length', `${depositEthData}0`],
        ['data shorter than a selector', '0x474cf5'],
        ['empty data', ''],
    ])('returns undefined for %s', (_name, data) => {
        expect(
            resolveDisplayFormat(
                depositEthFormat,
                { fromPath: FROM_PATH, to: POOL, value: 0n, data },
                OPTIONS,
            ),
        ).toBeUndefined();
    });

    it.each([
        ['without the 0x prefix', depositEthData.slice(2)],
        ['in upper case', `0X${depositEthData.slice(2).toUpperCase()}`],
        ['with surrounding whitespace', ` ${depositEthData}\n`],
    ])('accepts calldata %s', (_name, data) => {
        expect(
            resolveDisplayFormat(
                depositEthFormat,
                { fromPath: FROM_PATH, to: POOL, value: 0n, data },
                OPTIONS,
            )?.rows[1],
        ).toEqual({
            type: 'field',
            label: 'Collateral recipient',
            values: [{ type: 'address', address: FROM }],
        });
    });

    it.each<[string, Partial<EthereumDisplayFormat>]>([
        ['an address that is not hex', { address: 'not an address' }],
        ['an address of the wrong size', { address: '0x1234' }],
        [
            'a formatter newer than any firmware Suite knows',
            {
                fields: [
                    createField({
                        label: 'Field',
                        formatter: 'FORMATTER_FUTURE' as EthereumDisplayFormatField['formatter'],
                        path: { type: 'data', steps: [1] },
                    }),
                ],
            },
        ],
    ])('cannot display a definition with %s', (_name, overrides) => {
        expect(
            resolveDisplayFormat(
                { ...depositEthFormat, ...overrides },
                { fromPath: FROM_PATH, to: POOL, value: 0n, data: depositEthData },
                OPTIONS,
            ),
        ).toBeUndefined();
    });

    it('walks into tuples and arrays, and formats every element of an array', () => {
        const swap =
            'function swap((address token, uint256 amount) order, uint256[] fees, uint256 packedReceiver)';
        const displayFormat = createDisplayFormat(swap, {
            parameters: [
                { type: 'tuple', fields: [ADDRESS, UINT256] },
                { type: 'array', element: UINT256 },
                UINT256,
            ],
            fields: [
                createField({
                    label: 'Send',
                    formatter: 'FORMATTER_TOKEN_AMOUNT',
                    path: { type: 'data', steps: [0, 1] },
                    tokenPath: { type: 'data', steps: [0, 0] },
                }),
                createField({
                    label: 'Fees',
                    formatter: 'FORMATTER_RAW',
                    path: { type: 'data', steps: [1] },
                }),
                createField({
                    label: 'Last fee',
                    formatter: 'FORMATTER_RAW',
                    path: { type: 'data', steps: [1, -1] },
                }),
                createField({
                    label: 'Receiver',
                    formatter: 'FORMATTER_ADDRESS_NAME',
                    path: { type: 'data', steps: [2], slice: { start: -20 } },
                }),
            ],
        });
        const data = encodeFunctionData({
            abi: parseAbi([swap]),
            args: [{ token: USDC, amount: 1_500_000n }, [1n, 2n], (1n << 160n) | BigInt(RECIPIENT)],
        });

        expect(
            resolveDisplayFormat(
                displayFormat,
                { fromPath: FROM_PATH, to: POOL, value: 0n, data },
                OPTIONS,
            )?.rows,
        ).toEqual([
            {
                type: 'field',
                label: 'Send',
                values: [{ type: 'tokenAmount', amount: '1500000', tokenAddress: USDC }],
            },
            {
                type: 'field',
                label: 'Fees',
                values: [
                    { type: 'text', text: '1' },
                    { type: 'text', text: '2' },
                ],
            },
            { type: 'field', label: 'Last fee', values: [{ type: 'text', text: '2' }] },
            { type: 'field', label: 'Receiver', values: [{ type: 'address', address: RECIPIENT }] },
        ]);
    });

    it('cannot display a path that resolves to a tuple', () => {
        const signature = 'function order((address token, uint256 amount) order)';
        const displayFormat = createDisplayFormat(signature, {
            parameters: [{ type: 'tuple', fields: [ADDRESS, UINT256] }],
            fields: [
                createField({
                    label: 'Order',
                    formatter: 'FORMATTER_RAW',
                    path: { type: 'data', steps: [0] },
                }),
            ],
        });
        const data = encodeFunctionData({
            abi: parseAbi([signature]),
            args: [{ token: USDC, amount: 1n }],
        });

        expect(
            resolveDisplayFormat(
                displayFormat,
                { fromPath: FROM_PATH, to: POOL, value: 0n, data },
                OPTIONS,
            ),
        ).toBeUndefined();
    });

    describe('token amounts', () => {
        // Not `approve`, which the device decodes with its built-in definition.
        const approve = 'function allow(address spender, uint256 amount)';
        const resolveAmount = (field: Partial<EthereumDisplayFormatField>, amount: bigint) =>
            resolveDisplayFormat(
                createDisplayFormat(approve, {
                    parameters: [ADDRESS, UINT256],
                    fields: [
                        createField({
                            label: 'Amount',
                            formatter: 'FORMATTER_TOKEN_AMOUNT',
                            path: { type: 'data', steps: [1] },
                            ...field,
                        }),
                    ],
                }),
                {
                    fromPath: FROM_PATH,
                    to: USDC,
                    value: 0n,
                    data: encodeFunctionData({
                        abi: parseAbi([approve]),
                        args: [RECIPIENT, amount],
                    }),
                },
                OPTIONS,
            )?.rows[0]?.values[0];

        it('takes the token from the transaction recipient', () => {
            expect(
                resolveAmount({ tokenPath: { type: 'container', container: 'TO' } }, 5n),
            ).toEqual({ type: 'tokenAmount', amount: '5', tokenAddress: USDC });
        });

        it('prefers a constant token address over the token path', () => {
            expect(
                resolveAmount(
                    {
                        constTokenAddress: RECIPIENT.toLowerCase(),
                        tokenPath: { type: 'container', container: 'TO' },
                    },
                    5n,
                ),
            ).toEqual({ type: 'tokenAmount', amount: '5', tokenAddress: RECIPIENT });
        });

        it('shows a native currency address as a native amount', () => {
            expect(
                resolveAmount(
                    {
                        constTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        nativeCurrencyAddresses: ['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
                    },
                    5n,
                ),
            ).toEqual({ type: 'nativeAmount', amount: '5' });
        });

        it('leaves the token unknown when the definition does not name it', () => {
            expect(resolveAmount({}, 5n)).toEqual({ type: 'tokenAmount', amount: '5' });
        });

        it.each([
            [0xffn - 1n, { type: 'tokenAmount', amount: '254' }],
            [0xffn, { type: 'aboveThreshold', message: 'Unlimited' }],
        ])('compares %s with the threshold', (amount, expected) => {
            expect(
                resolveAmount({ threshold: '0x00ff', thresholdMessage: 'Unlimited' }, amount),
            ).toEqual(expected);
        });
    });

    describe('formatters', () => {
        const signature = 'function set(uint256 value, string note, bool flag)';
        const resolveField = (
            field: Pick<EthereumDisplayFormatField, 'formatter'> &
                Partial<EthereumDisplayFormatField>,
            value: bigint,
        ) =>
            resolveDisplayFormat(
                createDisplayFormat(signature, {
                    parameters: [
                        UINT256,
                        { type: 'dynamic', abiType: 'ABI_STRING' },
                        { type: 'atomic', abiType: 'ABI_BOOL' },
                    ],
                    fields: [
                        createField({
                            label: 'Field',
                            path: { type: 'data', steps: [0] },
                            ...field,
                        }),
                    ],
                }),
                {
                    fromPath: FROM_PATH,
                    to: POOL,
                    value: 0n,
                    data: encodeFunctionData({
                        abi: parseAbi([signature]),
                        args: [value, 'note', true],
                    }),
                },
                OPTIONS,
            )?.rows[0]?.values[0];

        it.each<[string, Parameters<typeof resolveField>[0], bigint, string]>([
            ['a duration', { formatter: 'FORMATTER_DURATION' }, 3_725n, '01:02:05'],
            ['a unit', { formatter: 'FORMATTER_UNIT', decimals: 2, base: '%' }, 1_250n, '12.5%'],
            [
                'a unit with an SI prefix',
                { formatter: 'FORMATTER_UNIT', base: 'gas', prefix: true },
                1_500_000n,
                '1.5Mgas',
            ],
            [
                'a large unit in exponent notation',
                { formatter: 'FORMATTER_UNIT', base: 'x' },
                1_234_567n,
                '1.23457e+06x',
            ],
            // Python's `{:g}` picks the notation after rounding to six significant digits.
            [
                'a unit rounding up to 1e+06',
                { formatter: 'FORMATTER_UNIT', decimals: 1 },
                9_999_997n,
                '1e+06',
            ],
            [
                'a unit rounding up to 0.0001',
                { formatter: 'FORMATTER_UNIT', decimals: 11 },
                9_999_996n,
                '0.0001',
            ],
            [
                'an enum',
                { formatter: 'FORMATTER_ENUM', enumValues: [{ key: 2, value: 'Variable' }] },
                2n,
                'Variable',
            ],
        ])('formats %s', (_name, field, value, text) => {
            expect(resolveField(field, value)).toEqual({ type: 'text', text });
        });

        it('formats a timestamp as a date', () => {
            expect(resolveField({ formatter: 'FORMATTER_DATE' }, 1_700_000_000n)).toEqual({
                type: 'date',
                timestamp: 1_700_000_000,
            });
        });

        it('cannot display an enum value the definition does not list', () => {
            expect(
                resolveField(
                    { formatter: 'FORMATTER_ENUM', enumValues: [{ key: 1, value: 'Stable' }] },
                    2n,
                ),
            ).toBeUndefined();
        });

        it('lets an error that is not a rejection through', () => {
            const field = createField({
                label: 'Field',
                formatter: 'FORMATTER_ENUM',
                path: { type: 'data', steps: [0] },
            });
            // A malformed definition object, not anything the device could be sent.
            const malformedField = {
                ...field,
                enumValues: undefined,
            } as unknown as EthereumDisplayFormatField;

            expect(() =>
                resolveDisplayFormat(
                    createDisplayFormat(signature, {
                        parameters: [
                            UINT256,
                            { type: 'dynamic', abiType: 'ABI_STRING' },
                            { type: 'atomic', abiType: 'ABI_BOOL' },
                        ],
                        fields: [malformedField],
                    }),
                    {
                        fromPath: FROM_PATH,
                        to: POOL,
                        value: 0n,
                        data: encodeFunctionData({
                            abi: parseAbi([signature]),
                            args: [2n, 'note', true],
                        }),
                    },
                    OPTIONS,
                ),
            ).toThrow(TypeError);
        });

        it('shows a constant value as it is', () => {
            expect(
                resolveField(
                    { formatter: 'FORMATTER_RAW', path: { type: 'const', value: 'Aave v3' } },
                    0n,
                ),
            ).toEqual({ type: 'text', text: 'Aave v3' });
        });
    });

    describe('embedded calls', () => {
        const ROUTER = getAddress('0x66a9893cc07d91d95644aedd05d03f95e1dba8af');
        // Ethereum's WETH contract.
        const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        const WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
        const BYTES: EthereumDisplayFormatAbiValue = { type: 'dynamic', abiType: 'ABI_BYTES' };

        const execute = 'function execute(address target, bytes data)';
        const multicall = 'function multicall(bytes[] data)';
        const aggregate = 'function aggregate(address[] targets, bytes[] data)';
        const transfer = 'function transfer(address to, uint256 amount)';
        const supply = 'function supply(address asset, uint256 amount, address onBehalfOf)';
        const withdraw = 'function withdraw(uint256 wad)';

        const callField = (field: Partial<EthereumDisplayFormatField> = {}) =>
            createField({
                label: 'Call',
                formatter: 'FORMATTER_CALLDATA',
                path: { type: 'data', steps: [1] },
                calleePath: { type: 'data', steps: [0] },
                ...field,
            });
        const executeFormat = createDisplayFormat(execute, {
            address: ROUTER,
            providerName: 'Router',
            intent: 'Execute',
            parameters: [ADDRESS, BYTES],
            fields: [callField()],
        });
        const multicallFormat = createDisplayFormat(multicall, {
            address: POOL,
            parameters: [{ type: 'array', element: BYTES }],
            fields: [
                callField({
                    path: { type: 'data', steps: [0] },
                    calleePath: { type: 'container', container: 'TO' },
                }),
            ],
        });
        // A definition downloaded for the embedded call, as for the outer one.
        const supplyFormat = createDisplayFormat(supply, {
            parameters: [ADDRESS, UINT256, ADDRESS],
            fields: [
                createField({
                    label: 'Amount',
                    formatter: 'FORMATTER_TOKEN_AMOUNT',
                    path: { type: 'data', steps: [1] },
                    tokenPath: { type: 'data', steps: [0] },
                }),
                createField({
                    label: 'On behalf of',
                    formatter: 'FORMATTER_ADDRESS_NAME',
                    path: { type: 'data', steps: [2] },
                }),
            ],
        });

        const encode = (signature: string, args: unknown[]) =>
            encodeFunctionData({ abi: parseAbi([signature]) as Abi, args });
        const supplyCall = encode(supply, [USDC, 5n, FROM]);
        const transferCall = encode(transfer, [RECIPIENT, 7n]);
        const resolve = (
            displayFormat: EthereumDisplayFormat,
            data: string,
            options: Partial<ResolveDisplayFormatOptions> = {
                subcallDisplayFormats: [supplyFormat],
            },
        ) =>
            resolveDisplayFormat(
                displayFormat,
                { fromPath: FROM_PATH, to: getAddress(displayFormat.address), value: 1n, data },
                { ...OPTIONS, ...options },
            )?.rows;

        it('shows the provider, intent and fields of an embedded call', () => {
            expect(resolve(executeFormat, encode(execute, [POOL, supplyCall]))).toEqual([
                {
                    type: 'subcallProvider',
                    subcall: { index: undefined },
                    values: [{ type: 'text', text: 'Aave' }],
                },
                {
                    type: 'subcallIntent',
                    subcall: { index: undefined },
                    values: [{ type: 'text', text: 'Supply' }],
                },
                {
                    type: 'field',
                    label: 'Amount',
                    subcall: { index: undefined },
                    values: [{ type: 'tokenAmount', amount: '5', tokenAddress: USDC }],
                },
                {
                    type: 'field',
                    label: 'On behalf of',
                    subcall: { index: undefined },
                    values: [{ type: 'address', address: FROM }],
                },
            ]);
        });

        it('decodes a token transfer without a downloaded definition, in the callee token', () => {
            expect(resolve(executeFormat, encode(execute, [USDC, transferCall]), {})).toEqual([
                {
                    type: 'subcallProvider',
                    subcall: { index: undefined },
                    values: [{ type: 'address', address: USDC }],
                },
                {
                    type: 'subcallIntent',
                    subcall: { index: undefined },
                    values: [{ type: 'text', text: 'Send' }],
                },
                {
                    type: 'field',
                    label: 'To',
                    subcall: { index: undefined },
                    values: [{ type: 'address', address: RECIPIENT }],
                },
                {
                    type: 'field',
                    label: 'Amount',
                    subcall: { index: undefined },
                    values: [{ type: 'tokenAmount', amount: '7', tokenAddress: USDC }],
                },
            ]);
        });

        it('numbers the calls of a multicall to the transaction recipient', () => {
            const rows = resolve(
                multicallFormat,
                encode(multicall, [[supplyCall, encode(supply, [USDC, 6n, FROM])]]),
            );

            expect(
                rows?.filter(row => row.type === 'subcallIntent').map(row => row.subcall),
            ).toEqual([{ index: 1 }, { index: 2 }]);
            expect(rows?.find(row => row.subcall?.index === 2 && row.type === 'field')).toEqual({
                type: 'field',
                label: 'Amount',
                subcall: { index: 2 },
                values: [{ type: 'tokenAmount', amount: '6', tokenAddress: USDC }],
            });
        });

        it('pairs the calls of a multicall with their own callees', () => {
            const aggregateFormat = createDisplayFormat(aggregate, {
                address: ROUTER,
                parameters: [
                    { type: 'array', element: ADDRESS },
                    { type: 'array', element: BYTES },
                ],
                fields: [callField()],
            });
            const rows = resolve(
                aggregateFormat,
                encode(aggregate, [
                    [POOL, USDC],
                    [supplyCall, transferCall],
                ]),
            );

            expect(
                rows?.filter(row => row.type === 'subcallIntent').map(row => row.values),
            ).toEqual([[{ type: 'text', text: 'Supply' }], [{ type: 'text', text: 'Send' }]]);
        });

        it('decodes arguments-only calldata with the selector the field names', () => {
            const format = createDisplayFormat(execute, {
                address: ROUTER,
                parameters: [ADDRESS, BYTES],
                fields: [callField({ selector: toFunctionSelector(supply) })],
            });

            expect(
                resolve(format, encode(execute, [POOL, `0x${supplyCall.slice(10)}`]))?.[1],
            ).toMatchObject({ type: 'subcallIntent', values: [{ text: 'Supply' }] });
        });

        it('decodes WETH withdraw only on a WETH deployment the firmware knows', () => {
            const unwrap = encode(withdraw, [9n]);

            expect(
                resolve({ ...executeFormat, chainId: 1 }, encode(execute, [WETH, unwrap]), {}),
            ).toContainEqual({
                type: 'field',
                label: 'Amount',
                subcall: { index: undefined },
                values: [{ type: 'nativeAmount', amount: '9' }],
            });
            // The same contract on another chain.
            expect(resolve(executeFormat, encode(execute, [WETH, unwrap]), {})?.[0]?.type).toBe(
                'subcallCallee',
            );
            // A wrapped native token that is not WETH.
            expect(
                resolve({ ...executeFormat, chainId: 56 }, encode(execute, [WBNB, unwrap]), {})?.[0]
                    ?.type,
            ).toBe('subcallCallee');
        });

        describe('on firmware without a formatter', () => {
            const durationField = createField({
                label: 'Lock',
                formatter: 'FORMATTER_DURATION',
                path: { type: 'data', steps: [1] },
            });

            it('does not clear-sign a definition that uses it', () => {
                expect(
                    resolveDisplayFormat(
                        createDisplayFormat(supply, {
                            parameters: [ADDRESS, UINT256, ADDRESS],
                            fields: [durationField],
                        }),
                        { fromPath: FROM_PATH, to: POOL, value: 0n, data: supplyCall },
                        { firmwareVersion: '2.12.4' },
                    ),
                ).toBeUndefined();
            });

            it('shows an embedded call whose definition uses it raw', () => {
                expect(
                    resolve(executeFormat, encode(execute, [POOL, supplyCall]), {
                        subcallDisplayFormats: [{ ...supplyFormat, fields: [durationField] }],
                        firmwareVersion: '2.12.4',
                    })?.[0]?.type,
                ).toBe('subcallCallee');
            });
        });

        describe('falls back to the callee and raw calldata', () => {
            const rawRows = (callee: string, calldata: string) => [
                {
                    type: 'subcallCallee',
                    subcall: { index: undefined },
                    values: [{ type: 'address', address: callee }],
                },
                {
                    type: 'field',
                    label: 'Call',
                    values: [{ type: 'text', text: calldata.slice(2) }],
                },
            ];

            it.each<[string, string, EthereumDisplayFormat[]]>([
                ['without a definition for the call', supplyCall, []],
                [
                    'with a definition for another chain',
                    supplyCall,
                    [{ ...supplyFormat, chainId: 1 }],
                ],
                ['for a truncated call', supplyCall.slice(0, -2), [supplyFormat]],
                ['for calldata shorter than a selector', '0x0102', [supplyFormat]],
            ])('%s', (_name, calldata, subcallDisplayFormats) => {
                expect(
                    resolve(executeFormat, encode(execute, [POOL, calldata]), {
                        subcallDisplayFormats,
                    }),
                ).toEqual(rawRows(POOL, calldata));
            });

            it('when the call reads the value, which depends on the wrapper', () => {
                const deposit = encode('function deposit()', []);

                expect(
                    resolve({ ...executeFormat, chainId: 1 }, encode(execute, [WETH, deposit]), {}),
                ).toEqual(rawRows(WETH, deposit));
            });

            it('numbering both rows in a multicall', () => {
                expect(resolve(multicallFormat, encode(multicall, [['0x0102']]), {})).toEqual([
                    {
                        type: 'subcallCallee',
                        subcall: { index: 1 },
                        values: [{ type: 'address', address: POOL }],
                    },
                    {
                        type: 'field',
                        label: 'Call',
                        subcall: { index: 1 },
                        values: [{ type: 'text', text: '0102' }],
                    },
                ]);
            });

            it('for a call embedded in an embedded call', () => {
                const innerExecute = { ...executeFormat, address: POOL };
                const rows = resolve(
                    executeFormat,
                    encode(execute, [POOL, encode(execute, [USDC, transferCall])]),
                    { subcallDisplayFormats: [innerExecute] },
                );

                // The device puts the outer call's position in front of the inner raw rows.
                expect(rows?.slice(2)).toEqual([
                    {
                        type: 'subcallCallee',
                        subcall: { index: undefined, outer: { index: undefined } },
                        values: [{ type: 'address', address: USDC }],
                    },
                    {
                        type: 'field',
                        label: 'Call',
                        subcall: { index: undefined },
                        values: [{ type: 'text', text: transferCall.slice(2) }],
                    },
                ]);
            });
        });

        it('keeps the inner position of a multicall embedded in an embedded call', () => {
            const innerMulticall = { ...multicallFormat, address: ROUTER.toLowerCase() };
            const rows = resolve(
                executeFormat,
                encode(execute, [ROUTER, encode(multicall, [['0x0102']])]),
                { subcallDisplayFormats: [innerMulticall] },
            );

            expect(rows?.find(row => row.type === 'subcallCallee')?.subcall).toEqual({
                index: 1,
                outer: { index: undefined },
            });
        });

        it('cannot display a call that firmware 2.12.4 decodes with a built-in swap', () => {
            const oneInch = '0x111111125421cA6dc452d289314280a0f8842A65';
            const swapCall = `0x07ed2379${'00'.repeat(32)}` as const;
            const data = encode(execute, [oneInch, swapCall]);
            const onEthereum = { ...executeFormat, chainId: 1 };

            expect(resolve(onEthereum, data, { firmwareVersion: '2.12.4' })).toBeUndefined();
            expect(resolve(onEthereum, data, { firmwareVersion: '2.12.5' })?.[0]?.type).toBe(
                'subcallCallee',
            );
        });

        it('cannot display a calldata field that does not resolve to bytes', () => {
            const format = createDisplayFormat(execute, {
                address: ROUTER,
                parameters: [ADDRESS, BYTES],
                fields: [callField({ path: { type: 'container', container: 'VALUE' } })],
            });

            expect(resolve(format, encode(execute, [POOL, supplyCall]))).toBeUndefined();
        });
    });

    describe('per firmware version', () => {
        const lend = 'function lend(address spender, uint256 amount)';
        const ETHER = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
        const amountField = (field: Partial<EthereumDisplayFormatField>) =>
            createField({
                label: 'Amount',
                formatter: 'FORMATTER_TOKEN_AMOUNT',
                path: { type: 'data', steps: [1] },
                ...field,
            });
        const resolveFields = (
            fields: EthereumDisplayFormatField[],
            firmwareVersion: string,
            amount = 5n,
        ) =>
            resolveDisplayFormat(
                createDisplayFormat(lend, { parameters: [ADDRESS, UINT256], fields }),
                {
                    fromPath: FROM_PATH,
                    to: USDC,
                    value: 0n,
                    data: encodeFunctionData({
                        abi: parseAbi([lend]),
                        args: [RECIPIENT, amount],
                    }),
                },
                { firmwareVersion },
            )?.rows;
        const tokenFromRecipient = { tokenPath: { type: 'container', container: 'TO' } } as const;

        it('predicts nothing before 2.12.4, whose firmware misreads arrays', () => {
            expect(resolveFields([amountField(tokenFromRecipient)], '2.12.3')).toBeUndefined();
        });

        it('leaves a call the device decodes with a built-in definition to its own review', () => {
            const approve = 'function approve(address spender, uint256 amount)';

            expect(
                resolveDisplayFormat(
                    createDisplayFormat(approve, {
                        parameters: [ADDRESS, UINT256],
                        fields: [amountField(tokenFromRecipient)],
                    }),
                    {
                        fromPath: FROM_PATH,
                        to: USDC,
                        value: 0n,
                        data: encodeFunctionData({
                            abi: parseAbi([approve]),
                            args: [RECIPIENT, 5n],
                        }),
                    },
                    OPTIONS,
                ),
            ).toBeUndefined();
        });

        it.each([
            ['2.12.5', { type: 'tokenAmount', amount: '255', tokenAddress: USDC }],
            ['2.13.0', { type: 'aboveThreshold', message: 'All', tokenAddress: USDC }],
        ])('compares the threshold like firmware %s', (version, expected) => {
            const field = amountField({
                ...tokenFromRecipient,
                threshold: '0x00ff',
                thresholdMessage: 'All',
            });

            expect(resolveFields([field], version, 0xffn)?.[0]?.values).toEqual([expected]);
        });

        it('shows its own "Unlimited" for a missing message, as firmware < 2.13.0 and an empty one', () => {
            const withMessage = (thresholdMessage: string) =>
                amountField({ ...tokenFromRecipient, threshold: '0x01', thresholdMessage });

            expect(resolveFields([withMessage('All')], '2.12.5')?.[0]?.values).toEqual([
                { type: 'aboveThreshold', tokenAddress: USDC },
            ]);
            expect(resolveFields([withMessage('')], '2.13.1')?.[0]?.values).toEqual([
                { type: 'aboveThreshold', tokenAddress: USDC },
            ]);
        });

        it('counts every amount above an empty threshold', () => {
            expect(
                resolveFields(
                    [amountField({ ...tokenFromRecipient, threshold: '0x' })],
                    '2.13.1',
                )?.[0]?.values,
            ).toEqual([{ type: 'aboveThreshold', tokenAddress: USDC }]);
        });

        it('reads native currency addresses from 2.13.0', () => {
            const field = amountField({
                constTokenAddress: ETHER,
                nativeCurrencyAddresses: [ETHER],
            });

            expect(resolveFields([field], '2.12.5')?.[0]?.values).toEqual([
                { type: 'tokenAmount', amount: '5', tokenAddress: getAddress(ETHER) },
            ]);
            expect(resolveFields([field], '2.13.0')?.[0]?.values).toEqual([
                { type: 'nativeAmount', amount: '5' },
            ]);
        });

        it('shows an amount without a token from 2.13.1', () => {
            expect(resolveFields([amountField({})], '2.13.0')).toBeUndefined();
            expect(resolveFields([amountField({})], '2.13.1')?.[0]?.values).toEqual([
                { type: 'tokenAmount', amount: '5' },
            ]);
        });

        it('names the signing account for @.from, as the device does', () => {
            const fromField = (formatter: EthereumDisplayFormatField['formatter']) =>
                createField({
                    label: 'From',
                    formatter,
                    path: { type: 'container', container: 'FROM' },
                });

            expect(resolveFields([fromField('FORMATTER_ADDRESS_NAME')], '2.13.1')).toEqual([
                { type: 'field', label: 'From', values: [{ type: 'text', text: 'ETH #1' }] },
            ]);
            // A name is no token address.
            expect(
                resolveFields(
                    [amountField({ tokenPath: { type: 'container', container: 'FROM' } })],
                    '2.13.1',
                ),
            ).toBeUndefined();
        });
    });
});
