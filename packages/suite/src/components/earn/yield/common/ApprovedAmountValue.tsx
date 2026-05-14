import { Translation } from '@suite/intl';
import type { YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { isAllowanceUnlimited } from '@suite-common/wallet-utils';
import { Spinner, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

export type ApprovedAmountValueProps = {
    token: YieldFlowDisplayToken;
    amount: string;
    isLoading: boolean;
    hasError: boolean;
};

export const ApprovedAmountValue = ({
    amount,
    token,
    isLoading,
    hasError,
}: ApprovedAmountValueProps) => {
    if (isLoading) {
        return <Spinner size={16} isDisabled />;
    }

    if (hasError) {
        return <Text typographyStyle="body-md">-</Text>;
    }

    if (isAllowanceUnlimited(amount, token.decimals)) {
        return (
            <Text typographyStyle="body-md">
                <Translation id="TR_APPROVE_AMOUNT_UNLIMITED" />
            </Text>
        );
    }

    return <FormattedCryptoAmount value={amount} symbol={token.symbol} />;
};
