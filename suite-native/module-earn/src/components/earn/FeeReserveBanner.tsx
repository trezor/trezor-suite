import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/networks';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { toTokenSymbol } from '@suite-common/wallet-types';
import { type AlertBoxIntent, BannerFull, Box, type BoxProps } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

type FeeReserveBannerProps = BoxProps & {
    networkSymbol: NetworkSymbol;
    amount: string;
    translationId: TxKeyPath;
    intent: AlertBoxIntent;
};

export const FeeReserveBanner = ({
    networkSymbol,
    amount,
    translationId,
    intent,
    ...boxProps
}: FeeReserveBannerProps) => {
    const { CryptoAmountFormatter } = useFormatters();

    const nativeSymbol = toTokenSymbol(getNetworkDisplaySymbol(networkSymbol));

    const values = {
        amount: CryptoAmountFormatter.format(amount, {
            symbol: networkSymbol,
            isBalance: true,
            withSymbol: false,
        }),
        nativeSymbol,
    };

    return (
        <Box {...boxProps}>
            <BannerFull
                intent={intent}
                title={<Translation id={translationId} values={values} />}
            />
        </Box>
    );
};
