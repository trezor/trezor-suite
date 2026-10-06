import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS, useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type UnstakeCanClaimAlertProps = {
    claimableAmount: string;
    symbol: NetworkSymbol;
};

export const UnstakeCanClaimAlert = ({ claimableAmount, symbol }: UnstakeCanClaimAlertProps) => {
    const { CryptoAmountFormatter: amountFormatter } = useFormatters();

    return (
        <BannerInline
            intent="info"
            title={
                <Translation
                    id="earn.unstakeFlowScreen.canClaimWarning"
                    values={{
                        amount: amountFormatter.format(claimableAmount, {
                            isBalance: true,
                            maxDisplayedDecimals: BASE_CRYPTO_MAX_DISPLAYED_DECIMALS,
                            symbol,
                            isEllipsisAppended: false,
                        }),
                    }}
                />
            }
        />
    );
};
