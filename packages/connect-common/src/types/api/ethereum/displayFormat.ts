import type { MessagesSchema as PROTO } from '@trezor/protobuf';

// ERC-7730 clear-signing definition the device uses to display a contract call, downloaded
// from the same source the device gets it from. Addresses and bytes are 0x-prefixed hex.

export type EthereumDisplayFormatAbiValue =
    | { type: 'atomic'; abiType: keyof typeof PROTO.EthereumABIType }
    | { type: 'dynamic'; abiType: keyof typeof PROTO.EthereumABIType }
    // Firmware older than 2.13.0 takes a top-level tuple's dynamism from `isDynamic`.
    | { type: 'tuple'; fields: EthereumDisplayFormatAbiValue[]; isDynamic?: boolean }
    | { type: 'array'; element: EthereumDisplayFormatAbiValue };

export type EthereumDisplayFormatPath =
    | { type: 'container'; container: keyof typeof PROTO.EthereumERC7730ContainerPath }
    | { type: 'const'; value: string }
    | { type: 'data'; steps: number[]; slice?: { start: number; end?: number } };

export type EthereumDisplayFormatField = {
    label: string;
    formatter: keyof typeof PROTO.EthereumERC7730FieldFormatterType;
    path: EthereumDisplayFormatPath;
    tokenPath?: EthereumDisplayFormatPath;
    constTokenAddress?: string;
    nativeCurrencyAddresses: string[];
    threshold?: string;
    thresholdMessage?: string;
    decimals?: number;
    base?: string;
    prefix?: boolean;
    calleePath?: EthereumDisplayFormatPath;
    // Set when the embedded calldata holds only the arguments of the call with this selector.
    selector?: string;
    enumValues: { key: number; value: string }[];
};

export type EthereumDisplayFormat = {
    chainId: number;
    address: string;
    functionSignature: string;
    intent: string;
    providerName?: string;
    parameters: EthereumDisplayFormatAbiValue[];
    fields: EthereumDisplayFormatField[];
};
