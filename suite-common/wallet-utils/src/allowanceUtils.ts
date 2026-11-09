import { UINT256_MAX } from '@suite-common/suite-constants';
import {
    type AllowanceAction,
    type AllowanceLimitType,
    type AllowanceTransactionType,
} from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { Calldata } from '@trezor/network-ethereum-suite-common';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { asAmountSubunit, asAmountUnit } from './AmountTypes';
import { unitsToSubunits } from './amountUtils';

const TOKEN_CONTRACTS_REQUIRING_APPROVAL_RESET = ['0xdAC17F958D2ee523a2206206994597C13D831ec7'];

type IsAllowanceUnlimitedParams = {
    amount: string;
    decimals: number;
    // Set when `amount` is already in subunits (e.g. a decoded on-chain approval)
    isSubunit?: boolean;
};

export const isAllowanceUnlimited = ({
    amount,
    decimals,
    isSubunit = false,
}: IsAllowanceUnlimitedParams): boolean => {
    const subunits = isSubunit
        ? new BigNumber(amount)
        : new BigNumber(unitsToSubunits({ value: asAmountUnit(new BigNumber(amount)), decimals }));

    return subunits.gte(new BigNumber(UINT256_MAX).dividedBy(2).integerValue());
};

export const tokenSupportsIncreasingAllowance = (contractAddress?: string): boolean => {
    if (!contractAddress) {
        return false;
    }

    const normalizedContractAddress = contractAddress.trim().toLowerCase();

    return !TOKEN_CONTRACTS_REQUIRING_APPROVAL_RESET.some(
        address => address.toLowerCase() === normalizedContractAddress,
    );
};

type ShouldShowRevokeAllowanceBannerParams = {
    followedByApproval?: boolean;
    preapprovedAmount?: string;
    approveAmount?: string;
    tokenContractAddress?: string;
};

export const shouldShowRevokeAllowanceBanner = ({
    followedByApproval,
    preapprovedAmount,
    approveAmount,
    tokenContractAddress,
}: ShouldShowRevokeAllowanceBannerParams): boolean => {
    if (!followedByApproval || !preapprovedAmount || preapprovedAmount === '0' || !approveAmount) {
        return false;
    }

    if (tokenSupportsIncreasingAllowance(tokenContractAddress)) {
        return false;
    }

    return new BigNumber(approveAmount).gt(preapprovedAmount);
};

type BuildApprovalTransactionDataParams = {
    amount: string;
    spender: string;
};

// TODO: drop this wrapper and migrate callers to `Calldata.evm.erc20.approve.encode` directly.
export const buildApprovalTransactionData = ({
    amount: rawAmount,
    spender: rawSpender,
}: BuildApprovalTransactionDataParams): string => {
    const result = Calldata.evm.erc20.approve.encode({
        spender: rawSpender,
        amount: new BigNumber(rawAmount),
    });

    if (!result.isValid || !result.data) {
        throw new Error(result.errors[0]?.code ?? 'INVALID_APPROVAL_PARAMS');
    }

    return result.data;
};

type GetAllowanceAmountParams = {
    rawAmount: string;
    approvalType: 'MINIMAL' | 'INFINITE' | 'ZERO' | 'PRESET';
    token: TokenInfo;
};

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

export const APPROVAL_TYPE_BY_LIMIT_TYPE = {
    minimal: 'MINIMAL',
    unlimited: 'INFINITE',
} as const satisfies Record<AllowanceLimitType, GetAllowanceAmountParams['approvalType']>;

type GetAllowanceAmountForLimitParams = {
    /** Requested amount in token units. */
    amount: string;
    limitType: AllowanceLimitType;
    token: TokenInfo;
};

export const getAllowanceAmountForLimit = ({
    amount,
    limitType,
    token,
}: GetAllowanceAmountForLimitParams) =>
    getAllowanceAmount({
        rawAmount: amount,
        approvalType: APPROVAL_TYPE_BY_LIMIT_TYPE[limitType],
        token,
    });

type GetAllowanceActionParams = {
    requestedAmount: string;
    currentAllowanceAmount?: string | null;
    shouldConsiderAllowance: boolean;
    isRevokeRequired: boolean;
    tokenContractAddress?: string | null;
};

export const getAllowanceAction = ({
    requestedAmount,
    currentAllowanceAmount,
    shouldConsiderAllowance,
    isRevokeRequired,
    tokenContractAddress,
}: GetAllowanceActionParams): AllowanceAction => {
    if (!shouldConsiderAllowance) {
        return 'approve';
    }

    const allowanceAmountValue = new BigNumber(currentAllowanceAmount || '0');
    const requestedAmountValue = new BigNumber(requestedAmount || '0');
    const hasAllowance = !!currentAllowanceAmount && !allowanceAmountValue.isZero();
    const isIncreasing = hasAllowance && requestedAmountValue.gt(allowanceAmountValue);
    const needsZeroReset =
        !!tokenContractAddress && !tokenSupportsIncreasingAllowance(tokenContractAddress);

    if (isRevokeRequired || (isIncreasing && needsZeroReset)) {
        return 'revoke';
    }

    if (isIncreasing) {
        return 'increase';
    }

    if (hasAllowance) {
        return 'continue';
    }

    return 'approve';
};

export const getAllowanceTransactionType = (
    action: AllowanceAction,
): AllowanceTransactionType | undefined => {
    switch (action) {
        case 'approve':
        case 'increase':
            return 'approve';
        case 'revoke':
            return 'revoke';
        case 'continue':
            return undefined;
        default:
            return exhaustive(action);
    }
};
