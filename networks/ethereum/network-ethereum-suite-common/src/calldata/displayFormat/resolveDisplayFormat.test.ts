import { encodeFunctionData, getAddress, parseAbi, toFunctionSelector } from 'viem';

import type {
    EthereumDisplayFormat,
    EthereumDisplayFormatAbiValue,
    EthereumDisplayFormatField,
} from '@trezor/connect-common';

import { resolveDisplayFormat } from './resolveDisplayFormat';

const FROM = getAddress('0x9c8e4d2bb3a6e5d7a3f0d1e0f84e3b1c2a7d6e5f');
const POOL = getAddress('0x721b9abab6511b46b9ee83a1aba23bdacb004149');
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const RECIPIENT = '0x000000000000000000000000000000000000dEaD';

const ADDRESS: EthereumDisplayFormatAbiValue = { type: 'atomic', abiType: 'ABI_ADDRESS' };
const UINT256: EthereumDisplayFormatAbiValue = { type: 'atomic', abiType: 'ABI_UINT256' };

const createField = (
    field: Partial<EthereumDisplayFormatField> &
        Pick<EthereumDisplayFormatField, 'label' | 'formatter' | 'path'>,
): EthereumDisplayFormatField => ({ nativeCurrencyAddresses: [], enumValues: [], ...field });

const createDisplayFormat = (
    signature: string,
    format: Pick<EthereumDisplayFormat, 'parameters' | 'fields'>,
): EthereumDisplayFormat => ({
    chainId: 100,
    address: POOL.toLowerCase(),
    functionSignature: toFunctionSelector(signature),
    intent: 'Supply',
    providerName: 'Aave',
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
            resolveDisplayFormat(depositEthFormat, {
                from: FROM,
                to: POOL,
                value: 10n ** 18n,
                data: depositEthData,
            }),
        ).toEqual({
            contractAddress: POOL,
            providerName: 'Aave',
            intent: 'Supply',
            rows: [
                {
                    label: 'Amount to supply',
                    values: [{ type: 'nativeAmount', amount: '1000000000000000000' }],
                },
                {
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
    ])('returns undefined for %s', (_name, data) => {
        expect(
            resolveDisplayFormat(depositEthFormat, { from: FROM, to: POOL, value: 0n, data }),
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
            resolveDisplayFormat(displayFormat, { from: FROM, to: POOL, value: 0n, data })?.rows,
        ).toEqual([
            {
                label: 'Send',
                values: [{ type: 'tokenAmount', amount: '1500000', tokenAddress: USDC }],
            },
            {
                label: 'Fees',
                values: [
                    { type: 'text', text: '1' },
                    { type: 'text', text: '2' },
                ],
            },
            { label: 'Last fee', values: [{ type: 'text', text: '2' }] },
            { label: 'Receiver', values: [{ type: 'address', address: RECIPIENT }] },
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
            resolveDisplayFormat(displayFormat, { from: FROM, to: POOL, value: 0n, data }),
        ).toBeUndefined();
    });

    describe('token amounts', () => {
        const approve = 'function approve(address spender, uint256 amount)';
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
                    from: FROM,
                    to: USDC,
                    value: 0n,
                    data: encodeFunctionData({
                        abi: parseAbi([approve]),
                        args: [RECIPIENT, amount],
                    }),
                },
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
                    from: FROM,
                    to: POOL,
                    value: 0n,
                    data: encodeFunctionData({
                        abi: parseAbi([signature]),
                        args: [value, 'note', true],
                    }),
                },
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

        it('shows a constant value as it is', () => {
            expect(
                resolveField(
                    { formatter: 'FORMATTER_RAW', path: { type: 'const', value: 'Aave v3' } },
                    0n,
                ),
            ).toEqual({ type: 'text', text: 'Aave v3' });
        });
    });
});
