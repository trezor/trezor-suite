import {
    type NetworkDisplaySymbol,
    type NetworkSymbol,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';
import {
    type StakeType,
    type TokenAddress,
    type TransactionType,
} from '@suite-common/wallet-types';
import { Box, CircularSpinner, RoundedIcon } from '@suite-native/atoms';
import { CryptoIcon, type IconName, type IconSize } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { type Color } from '@trezor/theme';

type TransactionIconProps = {
    transactionType: TransactionType;
    stakeOperationType?: StakeType;
    symbol?: NetworkSymbol;
    contractAddress?: TokenAddress;
    isAnimated?: boolean;
    backgroundColor?: Color;
    containerSize?: number;
    iconSize?: IconSize;
};

const transactionIconMap: Record<TransactionType, IconName> = {
    recv: 'arrowDown',
    sent: 'arrowUp',
    contract: 'circleDashed',
    joint: 'shuffle',
    self: 'arrowURightDown',
    failed: 'prohibit',
    unknown: 'circleDashed',
};

const stakeOperationIconMap: Record<StakeType, IconName> = {
    stake: 'arrowUp',
    unstake: 'arrowDown',
    claim: 'arrowDown',
    'change-delegate': 'arrowURightDown',
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
    contractAddress,
    transactionType,
    stakeOperationType,
    backgroundColor,
    containerSize = 48,
    iconSize = 'mediumLarge',
    isAnimated = false,
}: TransactionIconProps) => {
    const { applyStyle } = useNativeStyles();

    let iconSymbol: NetworkSymbol | NetworkDisplaySymbol | undefined;

    if (contractAddress) {
        iconSymbol = symbol;
    } else if (symbol) {
        iconSymbol = getNetworkDisplaySymbol(symbol) as NetworkDisplaySymbol;
    }

    const iconName = stakeOperationType
        ? stakeOperationIconMap[stakeOperationType]
        : transactionIconMap[transactionType];

    return (
        <Box>
            <RoundedIcon
                name={iconName}
                iconSize={iconSize}
                backgroundColor={backgroundColor}
                containerSize={containerSize}
            />
            {isAnimated && (
                <CircularSpinner size={containerSize} color="backgroundAlertYellowBold" width={3} />
            )}
            {iconSymbol && (
                <Box style={applyStyle(cryptoIconStyle)}>
                    <CryptoIcon symbol={iconSymbol} contractAddress={contractAddress} size="tiny" />
                </Box>
            )}
        </Box>
    );
};
