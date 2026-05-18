import { fromWei } from 'web3-utils';

import { Calldata } from '@suite-common/calldata';
import { UINT256_MAX } from '@suite-common/suite-constants';
import { type EvmTransactionPurpose } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { asAmountSubunit, asAmountUnit } from './AmountTypes';
import { unitsToSubunits } from './amountUtils';

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

export const evmHexToBigNumber = (hex: `0x${string}`) => new BigNumber(strip(hex) || '0', 16);

export const evmHexWeiToGwei = (hex: `0x${string}`) =>
    fromWei(evmHexToBigNumber(hex).toFixed(0), 'gwei');

export const getEvmTransactionTextSignature = (data?: string): EvmTransactionPurpose => {
    if (!data) return '';

    if (Calldata.evm.erc20.transfer.decode(data)) return 'transfer';

    const approve = Calldata.evm.erc20.approve.decode(data);
    if (approve) return approve.amount === 0n ? 'revoke' : 'approve';

    if (Calldata.evm.erc4626.deposit.decode(data)) return 'deposit';
    if (Calldata.evm.erc4626.withdraw.decode(data)) return 'withdraw';
    if (Calldata.evm.erc4626.redeem.decode(data)) return 'redeem';

    return 'unknown';
};

export const isEvmApprovalTx = (data?: string): boolean =>
    Calldata.evm.erc20.approve.decode(data) !== null;

export type EvmApprovalPurpose = Extract<EvmTransactionPurpose, 'approve' | 'revoke'>;

export const isEvmApprovalTxByTextSignature = (
    textSignature?: EvmTransactionPurpose,
): textSignature is EvmApprovalPurpose => textSignature === 'approve' || textSignature === 'revoke';

export const isEvmYieldTxByTextSignature = (textSignature?: EvmTransactionPurpose) =>
    textSignature === 'deposit' || textSignature === 'withdraw' || textSignature === 'redeem';

export const ensureHexPrefix = (hex?: string): string => {
    if (!hex) return '';

    return hex.startsWith('0x') ? hex : `0x${hex}`;
};

interface BuildTransactionDataParams {
    amount: string;
    spender: string;
}

// TODO: drop this wrapper and migrate callers to `Calldata.evm.erc20.approve.encode` directly.
export const buildApprovalTransactionData = ({
    amount: rawAmount,
    spender: rawSpender,
}: BuildTransactionDataParams): string => {
    const result = Calldata.evm.erc20.approve.encode({
        spender: rawSpender,
        amount: new BigNumber(rawAmount),
    });

    if (!result.isValid || !result.data) {
        throw new Error(result.errors[0]?.code ?? 'INVALID_APPROVAL_PARAMS');
    }

    return result.data;
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
