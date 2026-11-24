import { createAssetId } from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/networks';
import { AssetSymbol } from '@suite-native/assets';
import {
    type AlertBoxIntent,
    BannerFull,
    Box,
    type BoxProps,
    intentToColorMap,
} from '@suite-native/atoms';
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

    const values = {
        amount: CryptoAmountFormatter.format(amount, {
            symbol: networkSymbol,
            isBalance: true,
            withSymbol: false,
        }),
        nativeSymbol: (
            <AssetSymbol
                assetId={createAssetId({ networkSymbol })}
                color={intentToColorMap[intent].textColor}
            />
        ),
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
