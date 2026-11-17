import { Translation } from '@suite/intl';
import { useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isAllowanceUnlimited } from '@suite-common/wallet-utils';
import { Spinner, Text } from '@trezor/components';
import { type TypographyStyle } from '@trezor/theme';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';

type AllowanceAmountProps = {
    amount: string;
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
    typographyStyle?: TypographyStyle;
    isLoading?: boolean;
    hasError?: boolean;
    'data-testid'?: string;
};

export const AllowanceAmount = ({
    amount,
    networkSymbol,
    contractAddress,
    typographyStyle = 'body-md',
    isLoading = false,
    hasError = false,
    'data-testid': dataTest,
}: AllowanceAmountProps) => {
    const token = useTokenMetadata(networkSymbol, contractAddress);

    if (isLoading) {
        return <Spinner size={16} isDisabled />;
    }

    if (hasError) {
        return <Text typographyStyle={typographyStyle}>-</Text>;
    }

    if (
        token?.decimals !== undefined &&
        isAllowanceUnlimited({ amount, decimals: token.decimals })
    ) {
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
                networkSymbol={networkSymbol}
                contractAddress={contractAddress}
                data-testid={dataTest}
            />
        </Text>
    );
};
