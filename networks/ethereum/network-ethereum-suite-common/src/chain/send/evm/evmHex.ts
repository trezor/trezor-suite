import { Calldata } from '@suite-common/calldata';

export const isEip1559 = (
    tx: Record<string, any> | null | undefined,
): tx is { maxFeePerGas: string } => !!tx && !!tx.maxFeePerGas;

export const padLeftEven = (hex: string): string => (hex.length % 2 !== 0 ? `0${hex}` : hex);

export const sanitizeHex = ($hex: string): string => {
    const hex = $hex.toLowerCase().startsWith('0x') ? $hex.substring(2) : $hex;
    if (hex === '') return '';

    return `0x${padLeftEven(hex)}`;
};

export const strip = (str: string): string => {
    if (str.startsWith('0x')) {
        return padLeftEven(str.substring(2, str.length));
    }

    return padLeftEven(str);
};

export const isEvmApprovalTx = (data?: string): boolean =>
    Calldata.evm.erc20.approve.decode(data) !== null;
