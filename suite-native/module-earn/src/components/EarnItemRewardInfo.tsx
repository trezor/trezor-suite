import { type NetworkSymbol } from '@suite-common/wallet-config';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Icon, type IconName } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { type Color } from '@trezor/theme';

import { CRYPTO_BALANCE_DECIMALS } from '../constants';

type EarnDetailType = 'rewards' | 'pending';
type EarnItemRewardInfoProps = {
    value: string | null;
    symbol: NetworkSymbol;
    type: EarnDetailType;
};

const titleByType: Record<EarnDetailType, TxKeyPath> = {
    rewards: 'earn.earnScreen.earnItem.rewards',
    pending: 'earn.earnScreen.earnItem.pending',
};

const iconByType: Record<EarnDetailType, IconName> = {
    rewards: 'trendUp',
    pending: 'spinner',
};
const colorByType: Record<EarnDetailType, Color> = {
    rewards: 'textPrimaryDefault',
    pending: 'textAlertYellow',
};

export const EarnItemRewardInfo = ({ value, symbol, type }: EarnItemRewardInfoProps) => {
    const color = colorByType[type];

    return (
        <HStack justifyContent="space-between" alignItems="center">
            <HStack alignItems="center">
                <Icon name={iconByType[type]} size="mediumLarge" color={color} />
                <Text variant="body-sm" color={color}>
                    <Translation id={titleByType[type]} />
                </Text>
            </HStack>
            <VStack spacing={0}>
                <CryptoAmountFormatter
                    value={value}
                    style={{
                        textAlign: 'right',
                    }}
                    symbol={symbol}
                    decimals={CRYPTO_BALANCE_DECIMALS}
                    color={color}
                />
                <HStack spacing="sp2" alignItems="center" justifyContent="flex-end">
                    <Text color="textSubdued">≈</Text>
                    <CryptoToFiatAmountFormatter
                        value={value}
                        symbol={symbol}
                        color="textSubdued"
                        isBalance
                        variant="body-sm"
                    />
                </HStack>
            </VStack>
        </HStack>
    );
};
