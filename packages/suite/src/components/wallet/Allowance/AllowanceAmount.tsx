import { Translation } from '@suite/intl';
import { isAllowanceUnlimited } from '@suite-common/wallet-utils';
import { Spinner, Text } from '@trezor/components';
import { type TypographyStyle } from '@trezor/theme';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';

type AllowanceAmountProps = {
    amount: string;
    symbol?: string;
    decimals: number;
    contractAddress?: string | null;
    typographyStyle?: TypographyStyle;
    isLoading?: boolean;
    hasError?: boolean;
    'data-testid'?: string;
};

export const AllowanceAmount = ({
    amount,
    symbol,
    decimals,
    contractAddress,
    typographyStyle = 'body-md',
    isLoading = false,
    hasError = false,
    'data-testid': dataTest,
}: AllowanceAmountProps) => {
    if (isLoading) {
        return <Spinner size={16} isDisabled />;
    }

    if (hasError) {
        return <Text typographyStyle={typographyStyle}>-</Text>;
    }

    if (isAllowanceUnlimited({ amount, decimals })) {
        return (
            <Text typographyStyle={typographyStyle}>
                <Translation id="TR_APPROVE_AMOUNT_UNLIMITED" />
            </Text>
        );
    }

    return (
        <Text typographyStyle={typographyStyle}>
            <FormattedCryptoAmount
                value={amount}
                symbol={symbol}
                contractAddress={contractAddress}
                tokenDecimals={decimals}
                data-testid={dataTest}
            />
        </Text>
    );
};
