import { Box, RoundedIcon } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TokenAddress, TransactionType } from '@suite-common/wallet-types';
import { CryptoIcon, IconName, IconSize } from '@suite-native/icons';
import { Color } from '@trezor/theme';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { TransactionIconSpinner } from './TransactionIconSpinner';

type TransactionIconProps = {
    transactionType: TransactionType;
    networkSymbol?: NetworkSymbol;
    contractAddress?: TokenAddress;
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
    recv: 'arrowDown',
    sent: 'arrowUp',
    contract: 'circleDashed',
    joint: 'shuffle',
    self: 'arrowURightDown',
    failed: 'prohibit',
    unknown: 'circleDashed',
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
    networkSymbol,
    contractAddress,
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
            {networkSymbol && (
                <Box style={applyStyle(cryptoIconStyle)}>
                    <CryptoIcon
                        symbol={networkSymbol}
                        contractAddress={contractAddress}
                        size="extraSmall"
                    />
                </Box>
            )}
        </Box>
    );
};
