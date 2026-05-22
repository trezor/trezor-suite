import { UINT256_MAX } from '@suite-common/suite-constants';
import { BigNumber } from '@trezor/utils';

import { asAmountUnit } from './AmountTypes';
import { unitsToSubunits } from './amountUtils';

const TOKEN_CONTRACTS_REQUIRING_APPROVAL_RESET = ['0xdAC17F958D2ee523a2206206994597C13D831ec7'];

export const isAllowanceUnlimited = (amountUnits: string, decimals: number): boolean =>
    new BigNumber(
        unitsToSubunits({ value: asAmountUnit(new BigNumber(amountUnits)), decimals }),
    ).gte(new BigNumber(UINT256_MAX).dividedBy(2).integerValue());

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
