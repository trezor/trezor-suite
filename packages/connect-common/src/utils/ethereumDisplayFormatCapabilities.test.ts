import {
    type DisplayFormatCapabilities,
    getDisplayFormatCapabilities,
    isDisplayFormatSupported,
} from './ethereumDisplayFormatCapabilities';
import { mockEthereumDisplayFormat, mockEthereumDisplayFormatField } from '../../mocks';
import type {
    EthereumDisplayFormatAbiValue,
    EthereumDisplayFormatField,
} from '../types/api/ethereum/displayFormat';

const UINT256: EthereumDisplayFormatAbiValue = { type: 'atomic', abiType: 'ABI_UINT256' };
const STRING: EthereumDisplayFormatAbiValue = { type: 'dynamic', abiType: 'ABI_STRING' };

const capabilitiesOf = (firmwareVersion: string): DisplayFormatCapabilities => {
    const capabilities = getDisplayFormatCapabilities(firmwareVersion);
    if (!capabilities) throw new Error(`no capabilities for ${firmwareVersion}`);

    return capabilities;
};

describe(getDisplayFormatCapabilities.name, () => {
    it.each(['2.12.1', '2.12.3'])('predicts nothing on %s, which misreads arrays', version => {
        expect(getDisplayFormatCapabilities(version)).toBeUndefined();
    });

    it.each<[keyof DisplayFormatCapabilities, string, string]>([
        ['recursiveAbi', '2.12.5', '2.13.0'],
        ['inclusiveThreshold', '2.12.5', '2.13.0'],
        ['thresholdMessage', '2.12.5', '2.13.0'],
        ['nativeCurrencyAddresses', '2.12.5', '2.13.0'],
        ['tokenlessAmount', '2.13.0', '2.13.1'],
    ])('gains %s between %s and %s', (capability, before, from) => {
        expect(capabilitiesOf(before)[capability]).toBe(false);
        expect(capabilitiesOf(from)[capability]).toBe(true);
    });

    it('has the 1inch and Uniswap built-ins only on 2.12.4', () => {
        expect(capabilitiesOf('2.12.4').swapBuiltIns).toBe(true);
        expect(capabilitiesOf('2.12.5').swapBuiltIns).toBe(false);
    });

    it('knows the duration formatter from 2.13.0', () => {
        expect(capabilitiesOf('2.12.5').formatters.has('FORMATTER_DURATION')).toBe(false);
        expect(capabilitiesOf('2.13.0').formatters.has('FORMATTER_DURATION')).toBe(true);
        expect(capabilitiesOf('2.12.4').formatters.has('FORMATTER_CALLDATA')).toBe(true);
    });
});

describe(isDisplayFormatSupported.name, () => {
    const latest = capabilitiesOf('2.13.1');
    const legacy = capabilitiesOf('2.12.5');
    const field = (overrides: Partial<EthereumDisplayFormatField>) =>
        mockEthereumDisplayFormatField({
            label: 'Field',
            formatter: 'FORMATTER_RAW',
            path: { type: 'data', steps: [0] },
            ...overrides,
        });

    it('accepts a supported definition', () => {
        expect(isDisplayFormatSupported(mockEthereumDisplayFormat(), latest)).toBe(true);
    });

    it.each<[string, Parameters<typeof mockEthereumDisplayFormat>[0]]>([
        ['a selector that is not 4 bytes', { functionSignature: '0x474cf5' }],
        [
            'an atomic type that is dynamic',
            { parameters: [{ type: 'atomic', abiType: 'ABI_STRING' }] },
        ],
        [
            'a dynamic type that is atomic',
            { parameters: [{ type: 'dynamic', abiType: 'ABI_UINT8' }] },
        ],
        ['an empty tuple', { parameters: [{ type: 'tuple', fields: [] }] }],
        [
            'an enum without values',
            { fields: [field({ formatter: 'FORMATTER_ENUM', enumValues: [] })] },
        ],
        [
            'an enum with a repeated key',
            {
                fields: [
                    field({
                        formatter: 'FORMATTER_ENUM',
                        enumValues: [
                            { key: 1, value: 'A' },
                            { key: 1, value: 'B' },
                        ],
                    }),
                ],
            },
        ],
        [
            'a calldata field without a callee',
            { fields: [field({ formatter: 'FORMATTER_CALLDATA' })] },
        ],
        [
            'a calldata selector that is not 4 bytes',
            {
                fields: [
                    field({
                        formatter: 'FORMATTER_CALLDATA',
                        calleePath: { type: 'container', container: 'TO' },
                        selector: '0x12',
                    }),
                ],
            },
        ],
    ])('rejects %s', (_name, overrides) => {
        expect(isDisplayFormatSupported(mockEthereumDisplayFormat(overrides), latest)).toBe(false);
    });

    it('rejects a formatter the firmware does not know', () => {
        const displayFormat = mockEthereumDisplayFormat({
            fields: [field({ formatter: 'FORMATTER_DURATION' })],
        });

        expect(isDisplayFormatSupported(displayFormat, legacy)).toBe(false);
        expect(isDisplayFormatSupported(displayFormat, latest)).toBe(true);
    });

    it.each<[string, EthereumDisplayFormatAbiValue]>([
        ['a tuple in a tuple', { type: 'tuple', fields: [{ type: 'tuple', fields: [UINT256] }] }],
        ['an array in a tuple', { type: 'tuple', fields: [{ type: 'array', element: UINT256 }] }],
        [
            'an array of arrays of tuples',
            {
                type: 'array',
                element: { type: 'array', element: { type: 'tuple', fields: [UINT256] } },
            },
        ],
    ])('rejects %s before 2.13.0', (_name, parameter) => {
        const displayFormat = mockEthereumDisplayFormat({ parameters: [parameter] });

        expect(isDisplayFormatSupported(displayFormat, legacy)).toBe(false);
        expect(isDisplayFormatSupported(displayFormat, latest)).toBe(true);
    });

    it.each<[string, EthereumDisplayFormatAbiValue]>([
        ['a tuple of leaves', { type: 'tuple', fields: [UINT256, STRING] }],
        [
            'an array of tuples of leaves',
            { type: 'array', element: { type: 'tuple', fields: [UINT256, STRING] } },
        ],
        [
            'an array of arrays of leaves',
            { type: 'array', element: { type: 'array', element: STRING } },
        ],
    ])('accepts %s before 2.13.0', (_name, parameter) => {
        expect(
            isDisplayFormatSupported(
                mockEthereumDisplayFormat({ parameters: [parameter] }),
                legacy,
            ),
        ).toBe(true);
    });

    it('rejects more nesting than any firmware allows', () => {
        const parameter: EthereumDisplayFormatAbiValue = {
            type: 'array',
            element: { type: 'array', element: { type: 'array', element: UINT256 } },
        };

        expect(
            isDisplayFormatSupported(
                mockEthereumDisplayFormat({ parameters: [parameter] }),
                latest,
            ),
        ).toBe(false);
    });
});
