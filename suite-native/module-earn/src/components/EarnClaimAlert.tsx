import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS, useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, InlineAlertBox, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const claimAlertStyle = prepareNativeStyle(utils => ({
    marginHorizontal: utils.spacings.sp16,
    marginBottom: utils.spacings.sp12,
}));

type EarnClaimAlertProps = {
    claimableAmount: string;
    symbol: NetworkSymbol;
    onClaimPress: () => void;
};

export const EarnClaimAlert = ({ claimableAmount, symbol, onClaimPress }: EarnClaimAlertProps) => {
    const { applyStyle } = useNativeStyles();
    const { CryptoAmountFormatter: amountFormatter } = useFormatters();

    return (
        <Box style={applyStyle(claimAlertStyle)}>
            <InlineAlertBox
                variant="success"
                title={
                    <Translation
                        id="earn.claimableCard.readyToClaim"
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
                buttonLabel={
                    <Text variant="body-sm-strong" color="contentPrimaryInverse">
                        <Translation id="earn.claimableCard.claimButton" />
                    </Text>
                }
                onButtonPress={onClaimPress}
            />
        </Box>
    );
};
