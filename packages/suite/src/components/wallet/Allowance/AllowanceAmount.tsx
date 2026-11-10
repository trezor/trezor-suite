import { Translation } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isAllowanceUnlimited } from '@suite-common/wallet-utils';
import { Spinner, Text } from '@trezor/components';
import { type TypographyStyle } from '@trezor/theme';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';

type AllowanceAmountProps = {
    amount: string;
    symbol?: string;
    decimals: number;
    contractAddress?: string | null;
    /** The token's network, for an account token shown with its metadata. */
    networkSymbol?: NetworkSymbol;
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
    networkSymbol,
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
                networkSymbol={networkSymbol}
                tokenDecimals={decimals}
                data-testid={dataTest}
            />
        </Text>
    );
};
