import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, HStack } from '@suite-native/atoms';
import { ExactCryptoAmountFormatter } from '@suite-native/formatters';
import { NetworkIcon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const roundNetworkIconStyle = prepareNativeStyle(utils => ({
    borderRadius: utils.borders.radii.round,
    overflow: 'hidden',
}));

type TransactionCompleteAmountValueProps = {
    accountSymbol: NetworkSymbol;
    amountInBaseUnits: string;
};

export const TransactionCompleteAmountValue = ({
    accountSymbol,
    amountInBaseUnits,
}: TransactionCompleteAmountValueProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack spacing="sp4" alignItems="center" flexShrink={1}>
            <Box style={applyStyle(roundNetworkIconStyle)}>
                <NetworkIcon symbol={accountSymbol} size={20} />
            </Box>
            <ExactCryptoAmountFormatter
                value={amountInBaseUnits}
                symbol={accountSymbol}
                variant="body-md-strong"
                color="contentPrimary"
                numberOfLines={1}
                isBalance={false}
                isDiscreetText={false}
            />
        </HStack>
    );
};
