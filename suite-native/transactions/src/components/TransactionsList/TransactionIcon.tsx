import { Box, RoundedIcon } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TransactionType } from '@suite-common/wallet-types';
import { CoinSymbol, CryptoIcon, IconName } from '@suite-common/icons';
import { Color } from '@trezor/theme';

import { TransactionIconSpinner } from './TransactionIconSpinner';

type TransactionIconProps = {
    symbol: CoinSymbol;
    transactionType: TransactionType;
    isAnimated?: boolean;
    iconColor?: Color;
};

const SPINNER_RADIUS = 24;

const transactionIconMap: Record<TransactionType, IconName> = {
    recv: 'receive',
    sent: 'send',
    contract: 'placeholder',
    joint: 'shuffle',
    self: 'arrowURightDown',
    failed: 'placeholder',
    unknown: 'placeholder',
};

const cryptoIconStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    right: -2,
    bottom: -2,
    padding: 2,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.round,
}));

export const TransactionIcon = ({
    symbol,
    transactionType,
    isAnimated = false,
    iconColor = 'iconSubdued',
}: TransactionIconProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box>
            <RoundedIcon
                name={transactionIconMap[transactionType]}
                color={iconColor}
                iconSize="mediumLarge"
            />
            {isAnimated && <TransactionIconSpinner radius={SPINNER_RADIUS} color={iconColor} />}
            <Box style={applyStyle(cryptoIconStyle)}>
                <CryptoIcon symbol={symbol} size="xs" />
            </Box>
        </Box>
    );
};
