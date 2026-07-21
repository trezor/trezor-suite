import { Calldata } from '@suite-common/calldata';
import { UINT256_MAX } from '@suite-common/suite-constants';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type EvmTransactionPurpose,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { type EthereumSpecific, type TokenInfo } from '@trezor/blockchain-link-types';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { asAmountSubunit, asAmountUnit } from './AmountTypes';
import { unitsToSubunits } from './amountUtils';
import { isWrappedNativeToken } from './tokenUtils';

export const isEip1559 = (
    tx: Record<string, any> | null | undefined,
): tx is { maxFeePerGas: string } => !!tx && !!tx.maxFeePerGas;

// Returns the per-gas price actually charged: effectiveGasPrice when present and > 0
// (L2 networks), otherwise the gasPrice bid. Mirrors blockbook's L2 fee logic.
export const getEffectiveGasPrice = (
    ethereumSpecific: Pick<EthereumSpecific, 'effectiveGasPrice' | 'gasPrice'> | undefined,
): string =>
    ethereumSpecific?.effectiveGasPrice && new BigNumber(ethereumSpecific.effectiveGasPrice).gt(0)
        ? ethereumSpecific.effectiveGasPrice
        : (ethereumSpecific?.gasPrice ?? '0');

export const hasEip1559MaxPriorityFee = (
    tx: Record<string, any> | null | undefined,
): tx is { maxPriorityFeePerGas: string } => !!tx && !!tx.maxPriorityFeePerGas;

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

type WrappedNativeTxParams = {
    networkSymbol: NetworkSymbol;
    to?: string | null;
    data?: string | null;
};

// deposit() (0xd0e30db0) is a generic selector shared by many contracts, so the selector alone is
// not enough — the target must also be the chain's wrapped-native contract.
export const isWrapNativeTx = ({ networkSymbol, to, data }: WrappedNativeTxParams): boolean =>
    isWrappedNativeToken(networkSymbol, to) &&
    Calldata.evm.weth.deposit.decode(data ?? undefined) !== null;

export const isUnwrapNativeTx = ({ networkSymbol, to, data }: WrappedNativeTxParams): boolean =>
    isWrappedNativeToken(networkSymbol, to) &&
    Calldata.evm.weth.withdraw.decode(data ?? undefined) !== null;

export const getEvmTransactionTextSignature = (data?: string): EvmTransactionPurpose => {
    if (!data) return '';

    if (Calldata.evm.erc20.transfer.decode(data)) return 'transfer';

    const approve = Calldata.evm.erc20.approve.decode(data);
    if (approve) return approve.amount === 0n ? 'revoke' : 'approve';

    if (Calldata.evm.erc4626.deposit.decode(data)) return 'deposit';
    if (Calldata.evm.erc4626.withdraw.decode(data)) return 'withdraw';
    if (Calldata.evm.erc4626.redeem.decode(data)) return 'redeem';

    if (Calldata.evm.distributor.claim.decode(data)) return 'claim';

    return 'unknown';
};

/**
 * Purpose of an EVM transaction resolved from its full context. Extends the calldata-only
 * `getEvmTransactionTextSignature` with the wrap/unwrap classification, which needs the
 * transaction target — the WETH deposit()/withdraw() selectors are shared by many contracts,
 * so they only count when the target is the chain's wrapped-native contract.
 */
export const getEvmTransactionPurpose = ({
    networkSymbol,
    to,
    data,
}: WrappedNativeTxParams): EvmTransactionPurpose => {
    if (isWrapNativeTx({ networkSymbol, to, data })) return 'wrap';
    if (isUnwrapNativeTx({ networkSymbol, to, data })) return 'unwrap';

    return getEvmTransactionTextSignature(data ?? undefined);
};

// Amount (in wei) unwrapped by a WETH withdraw(uint256) call, or null when data is not one.
export const getUnwrapAmountByEthereumDataHex = (data?: string): string | null =>
    Calldata.evm.weth.withdraw.decode(data)?.wad.toString() ?? null;

/**
 * The chain's wrapped-native (WETH) contract address when the transaction touches it. The contract
 * shows up as the value recipient for a wrap and as the internal ETH sender for an unwrap, so both
 * `targets` and `internalTransfers` are considered when resolving the target.
 */
export const getWrappedNativeTxTarget = (
    transaction: WalletAccountTransaction,
): string | undefined => {
    const candidateAddresses = [
        ...transaction.targets.flatMap(target => target.addresses ?? []),
        ...transaction.internalTransfers.map(transfer => transfer.from),
    ];

    return candidateAddresses.find(address => isWrappedNativeToken(transaction.symbol, address));
};

/** Classifies an EVM transaction as a native wrap/unwrap for display. */
export const getNativeWrapTxKind = (
    transaction: WalletAccountTransaction,
): 'wrap' | 'unwrap' | undefined => {
    const { symbol } = transaction;
    const data = transaction.ethereumSpecific?.data;
    const to = getWrappedNativeTxTarget(transaction);

    if (!to) return undefined;
    if (isWrapNativeTx({ networkSymbol: symbol, to, data })) return 'wrap';
    if (isUnwrapNativeTx({ networkSymbol: symbol, to, data })) return 'unwrap';

    return undefined;
};

export const isEvmApprovalTx = (data?: string): boolean =>
    Calldata.evm.erc20.approve.decode(data) !== null;

export const getErc20ApproveSpender = (data?: string): string | undefined =>
    Calldata.evm.erc20.approve.decode(data)?.spender;

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
