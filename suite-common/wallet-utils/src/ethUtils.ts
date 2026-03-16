import { decodeParameters } from 'web3-eth-abi';
import { sha3 } from 'web3-utils';

import { UINT256_MAX } from '@suite-common/suite-constants';
import { type EvmTransactionPurpose } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { asAmountSubunit, asAmountUnit } from './AmountTypes';
import { unitsToSubunits } from './amountUtils';
import { isAddressValid } from './validationUtils';

export const isEip1559 = (
    tx: Record<string, any> | null | undefined,
): tx is { maxFeePerGas: string } => !!tx && !!tx.maxFeePerGas;

export const hasEip1559MaxPriorityFee = (
    tx: Record<string, any> | null | undefined,
): tx is { maxPriorityFeePerGas: string } => !!tx && !!tx.maxPriorityFeePerGas;

export const padLeftEven = (hex: string): string => (hex.length % 2 !== 0 ? `0${hex}` : hex);

export const sanitizeHex = ($hex: string): string => {
    const hex = $hex.toLowerCase().substring(0, 2) === '0x' ? $hex.substring(2) : $hex;
    if (hex === '') return '';

    return `0x${padLeftEven(hex)}`;
};

export const strip = (str: string): string => {
    if (str.indexOf('0x') === 0) {
        return padLeftEven(str.substring(2, str.length));
    }

    return padLeftEven(str);
};

interface EvmTxData {
    type: EvmTransactionPurpose;
    amount: string;
}

interface EvmTxApprovalData extends EvmTxData {
    spender: string;
}

interface EvmTxTransferData extends EvmTxData {
    recipient: string;
}

const normalizeHex = (data: string) =>
    data.toLowerCase().startsWith('0x') ? data.toLowerCase() : `0x${data.toLowerCase()}`;

const ERC20_APPROVE_SELECTOR = sha3('approve(address,uint256)')!.slice(0, 10);
const ERC20_TRANSFER_SELECTOR = sha3('transfer(address,uint256)')!.slice(0, 10);

export const getEvmApprovalTxData = (data?: string): EvmTxApprovalData | null => {
    if (!data) return null;

    const dataWithPrefix = normalizeHex(data);
    const dataLowercase = dataWithPrefix.toLowerCase();
    try {
        const hasApprovalPrefix = dataLowercase.startsWith(ERC20_APPROVE_SELECTOR);

        if (!hasApprovalPrefix) return null;

        const decodedData = decodeParameters(['address', 'uint256'], dataLowercase.slice(10)); // [spender, approval_amount]

        if (typeof decodedData[0] !== 'string' || typeof decodedData[1] !== 'bigint') return null;

        return {
            type: decodedData[1] === 0n ? 'revoke' : 'approve',
            spender: decodedData[0].toLowerCase(),
            amount: decodedData[1].toString(),
        };
    } catch {
        return null;
    }
};

export const getEvmTransferTxData = (data?: string): EvmTxTransferData | null => {
    if (!data) return null;

    const d = normalizeHex(data);

    try {
        if (!d.startsWith(ERC20_TRANSFER_SELECTOR)) return null;

        const decoded = decodeParameters(['address', 'uint256'], d.slice(10)); // [to, amount]

        if (typeof decoded[0] !== 'string' || typeof decoded[1] !== 'bigint') return null;

        return {
            type: 'transfer',
            recipient: decoded[0].toLowerCase(),
            amount: decoded[1].toString(),
        };
    } catch {
        return null;
    }
};

export const getEvmTransactionTextSignature = (data?: string): EvmTransactionPurpose => {
    // no data -> no method > no text signature
    if (!data) {
        return '';
    }

    const tokenTransferTxData = getEvmTransferTxData(data);
    if (tokenTransferTxData?.type) {
        return tokenTransferTxData.type;
    }

    const approvalTxData = getEvmApprovalTxData(data);
    if (approvalTxData?.type) {
        return approvalTxData.type;
    }

    return 'unknown';
};

export const isEvmApprovalTx = (data?: string): boolean => {
    const result = getEvmApprovalTxData(data);

    return result !== null;
};

export type EvmApprovalPurpose = Extract<EvmTransactionPurpose, 'approve' | 'revoke'>;

export const isEvmApprovalTxByTextSignature = (
    textSignature?: EvmTransactionPurpose,
): textSignature is EvmApprovalPurpose => textSignature === 'approve' || textSignature === 'revoke';

export const ensureHexPrefix = (hex?: string): string => {
    if (!hex) return '';

    return hex.startsWith('0x') ? hex : `0x${hex}`;
};

interface BuildTransactionDataParams {
    amount: string;
    spender: string;
}

export const buildApprovalTransactionData = ({
    amount: rawAmount,
    spender: rawSpender,
}: BuildTransactionDataParams): string => {
    if (!isAddressValid(rawSpender, 'base')) {
        throw new Error('Invalid spender address');
    }

    const amount = new BigNumber(rawAmount);
    const spender = rawSpender.toLowerCase().replace(/^0x/, '').padStart(64, '0');

    if (amount.isNaN() || !amount.isInteger() || amount.isNegative() || amount.gt(UINT256_MAX)) {
        throw new Error('Invalid amount');
    }

    const amountHex = amount.toString(16).padStart(64, '0');

    return `${ERC20_APPROVE_SELECTOR}${spender}${amountHex}`;
};

interface GetAllowanceAmountParams {
    rawAmount: string;
    approvalType: 'MINIMAL' | 'INFINITE' | 'ZERO' | 'PRESET';
    token: TokenInfo;
}

export const getAllowanceAmount = ({
    rawAmount,
    approvalType,
    token,
}: GetAllowanceAmountParams) => {
    const inputAmount = unitsToSubunits({
        value: asAmountUnit(new BigNumber(rawAmount)),
        decimals: token.decimals,
    });

    const getAmount = () => {
        switch (approvalType) {
            case 'INFINITE':
                return asAmountSubunit(new BigNumber(UINT256_MAX)).toString();
            case 'ZERO':
                return '0';
            case 'MINIMAL':
            case 'PRESET':
                return inputAmount.toString();
            default:
                exhaustive(approvalType);
        }
    };

    const allowanceAmount = getAmount();

    return { inputAmount, allowanceAmount };
};
