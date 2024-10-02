import { Box, RoundedIcon } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TransactionType } from '@suite-common/wallet-types';
import { CoinSymbol, CryptoIcon, IconName, IconSize } from '@suite-common/icons-deprecated';
import { Color } from '@trezor/theme';

import { TransactionIconSpinner } from './TransactionIconSpinner';

type TransactionIconProps = {
    transactionType: TransactionType;
    symbol?: CoinSymbol;
    isAnimated?: boolean;
    iconColor?: Color;
    spinnerColor?: Color;
    spinnerWidth?: number;
    backgroundColor?: Color;
    containerSize?: number;
    iconSize?: IconSize;
};

const DEFAULT_CONTAINER_SIZE = 48;

const transactionIconMap: Record<TransactionType, IconName> = {
    recv: 'receiveLight',
    sent: 'sendLight',
    contract: 'placeholderLight',
    joint: 'shuffleLight',
    self: 'arrowURightDownLight',
    failed: 'placeholderLight',
    unknown: 'placeholderLight',
};

const cryptoIconStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    right: -utils.spacings.sp2,
    bottom: -utils.spacings.sp2,
    padding: utils.spacings.sp2,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.round,
}));

export const TransactionIcon = ({
    symbol,
    transactionType,
    backgroundColor,
    spinnerColor,
    spinnerWidth,
    containerSize = DEFAULT_CONTAINER_SIZE,
    iconSize = 'mediumLarge',
    isAnimated = false,
    iconColor = 'iconSubdued',
}: TransactionIconProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box>
            <RoundedIcon
                name={transactionIconMap[transactionType]}
                color={iconColor}
                iconSize={iconSize}
                backgroundColor={backgroundColor}
                containerSize={containerSize}
            />
            {isAnimated && (
                <TransactionIconSpinner
                    size={containerSize}
                    color={spinnerColor ?? iconColor}
                    width={spinnerWidth}
                />
            )}
            {symbol && (
                <Box style={applyStyle(cryptoIconStyle)}>
                    <CryptoIcon symbol={symbol} size="extraSmall" />
                </Box>
            )}
        </Box>
    );
};
