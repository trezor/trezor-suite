import { useMemo } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountKey } from '@suite-common/wallet-types';
import { calculateRewards } from '@suite-common/wallet-utils';
import { HStack, OrderedListIcon, Text, VStack } from '@suite-native/atoms';
import { IconName } from '@suite-native/icons';
import { Translation, TxKeyPath } from '@suite-native/intl';
import {
    selectAPYByAccountKey,
    selectAccountCryptoBalanceWithStaking,
    useSelector as useNativeStakingSelector,
} from '@suite-native/staking';

const benefitItems: { icon: IconName; titleKey: TxKeyPath; descriptionKey: TxKeyPath }[] = [
    {
        icon: 'piggyBank',
        titleKey: 'earn.howStakeWorksScreen.benefits.first.title',
        descriptionKey: 'earn.howStakeWorksScreen.benefits.first.description',
    },
    {
        icon: 'trendUp',
        titleKey: 'earn.howStakeWorksScreen.benefits.second.title',
        descriptionKey: 'earn.howStakeWorksScreen.benefits.second.description',
    },
    {
        icon: 'clock',
        titleKey: 'earn.howStakeWorksScreen.benefits.third.title',
        descriptionKey: 'earn.howStakeWorksScreen.benefits.third.description',
    },
];

type HowStakeWorksBenefitsSectionProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
};

export const HowStakeWorksBenefitsSection = ({
    symbol,
    accountKey,
}: HowStakeWorksBenefitsSectionProps) => {
    const { CryptoAmountFormatter } = useFormatters();
    const uppercasedSymbol = symbol.toUpperCase();
    const totalBalance = useNativeStakingSelector(state =>
        selectAccountCryptoBalanceWithStaking(state, accountKey),
    );
    const apy = useNativeStakingSelector(state => selectAPYByAccountKey(state, accountKey));

    const potentialRewards = useMemo(() => {
        const amount = calculateRewards(totalBalance, apy);

        return CryptoAmountFormatter.format(amount, {
            symbol,
            isBalance: true,
            withSymbol: false,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        });
    }, [totalBalance, apy, CryptoAmountFormatter, symbol]);

    return (
        <VStack spacing={16}>
            {benefitItems.map(item => (
                <HStack key={item.titleKey} spacing="sp12" alignItems="center">
                    <OrderedListIcon
                        iconName={item.icon}
                        iconSize="large"
                        iconColor="iconPrimaryDefault"
                        iconBackgroundColor="backgroundPrimarySubtleOnElevation1"
                        iconBorderColor="backgroundPrimarySubtleOnElevationNegative"
                    />
                    <VStack spacing={0}>
                        <Text variant="body-md-strong">
                            <Translation
                                id={item.titleKey}
                                values={{
                                    symbol: uppercasedSymbol,
                                    potentialRewards,
                                }}
                            />
                        </Text>
                        <Text variant="body-sm" color="textSubdued">
                            <Translation
                                id={item.descriptionKey}
                                values={{ symbol: uppercasedSymbol }}
                            />
                        </Text>
                    </VStack>
                </HStack>
            ))}
        </VStack>
    );
};
