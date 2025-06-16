import { decodeParameters } from 'web3-eth-abi';
import { sha3 } from 'web3-utils';

import { BigNumber } from '@trezor/utils/src/bigNumber';

export const isEip1559 = (
    tx: Record<string, any> | null | undefined,
): tx is { maxFeePerGas: string } => !!tx && !!tx.maxFeePerGas;

export const hasEip1559MaxPriorityFee = (
    tx: Record<string, any> | null | undefined,
): tx is { maxPriorityFeePerGas: string } => !!tx && !!tx.maxPriorityFeePerGas;

export const decimalToHex = (dec: number): string => new BigNumber(dec).toString(16);

export const padLeftEven = (hex: string): string => (hex.length % 2 !== 0 ? `0${hex}` : hex);

export const sanitizeHex = ($hex: string): string => {
    const hex = $hex.toLowerCase().substring(0, 2) === '0x' ? $hex.substring(2) : $hex;
    if (hex === '') return '';

    return `0x${padLeftEven(hex)}`;
};

export const hexToDecimal = (hex: number): string => {
    const sanitized: string = sanitizeHex(hex.toString());

    return !sanitized ? 'null' : new BigNumber(sanitized).toString();
};

export const strip = (str: string): string => {
    if (str.indexOf('0x') === 0) {
        return padLeftEven(str.substring(2, str.length));
    }

    return padLeftEven(str);
};

type EvmTransactionPurpose = 'default' | 'approval' | 'revoke';

export const getEvmTransactionTextSignature = (data?: string): EvmTransactionPurpose => {
    if (!data) return 'default';

    const dataWithPrefix = data.toLowerCase().startsWith('0x') ? data : `0x${data}`;
    const dataLowercase = dataWithPrefix.toLowerCase();
    const approvalPrefix = sha3('approve(address,uint256)')?.slice(0, 10);
    const hasApprovalPrefix = !!approvalPrefix && dataLowercase.startsWith(approvalPrefix);

    if (hasApprovalPrefix) {
        try {
            const decodedData = decodeParameters(['address', 'uint256'], dataLowercase.slice(10)); // [spender, approval_amount]

            // when approval amount is 0 -> revoke
            if (decodedData[1] === 0n) {
                return 'revoke';
            }

            return 'approval';
        } catch {
            // If decoding fails, treat as default transaction
            return 'default';
        }
    }

    return 'default';
};
