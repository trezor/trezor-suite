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
import {
    Box,
    CircularSpinner,
    RoundedIcon,
    type RoundedIconIntent,
    type RoundedIconSize,
} from '@suite-native/atoms';
import { CryptoIcon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type TransactionIconProps = {
    transactionType: TransactionType;
    stakeOperationType?: StakeType;
    symbol?: NetworkSymbol;
    contractAddress?: TokenAddress;
    isAnimated?: boolean;
    intent?: RoundedIconIntent;
    size?: RoundedIconSize;
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
    backgroundColor: utils.colors.surfaceFillRaised,
    borderRadius: utils.borders.radii.round,
}));

export const TransactionIcon = ({
    symbol,
    contractAddress,
    transactionType,
    stakeOperationType,
    intent,
    size = 48,
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
            <RoundedIcon name={iconName} intent={intent} size={size} />
            {isAnimated && (
                <CircularSpinner size={size} color="legacyBackgroundAlertYellowBold" width={3} />
            )}
            {iconSymbol && (
                <Box style={applyStyle(cryptoIconStyle)}>
                    <CryptoIcon symbol={iconSymbol} contractAddress={contractAddress} size="tiny" />
                </Box>
            )}
        </Box>
    );
};
