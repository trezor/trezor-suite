import { Pressable } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { useYieldOpportunity } from '@suite-common/earn-stablecoin-api';
import { getYieldVaultContractAddress } from '@suite-common/wallet-core';
import { type Account, type TokenAddress, toTokenAddress } from '@suite-common/wallet-types';
import { Badge, type BadgeProps } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import {
    AppTabsRoutes,
    EarnStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type YieldBadgeVariant = 'inactive' | 'active' | 'promo';

type YieldBadgeVariantConfig = {
    translationId: TxKeyPath;
    intent?: BadgeProps['intent'];
};

const variantConfigMap: Record<YieldBadgeVariant, YieldBadgeVariantConfig> = {
    inactive: {
        translationId: 'moduleAccountManagement.accountDetailContentScreen.yieldBadge.upToRate',
        intent: 'brand',
    },
    active: {
        translationId: 'moduleAccountManagement.accountDetailContentScreen.yieldBadge.yieldRate',
        intent: 'brand',
    },
    promo: {
        translationId: 'moduleAccountManagement.accountDetailContentScreen.yieldBadge.promoRate',
        intent: 'brand',
    },
};

interface YieldBadgeProps {
    apy: number;
    variant: YieldBadgeVariant;
    account: Account;
    vaultId: string;
    tokenContract?: TokenAddress;
}

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>;

export const YieldBadge = ({ apy, variant, account, vaultId, tokenContract }: YieldBadgeProps) => {
    const navigation = useNavigation<NavigationProps>();
    const { data: vault } = useYieldOpportunity(vaultId);

    const { translationId, intent } = variantConfigMap[variant];

    const vaultTokenContract = vault ? getYieldVaultContractAddress(vault) : null;

    const goToVault = () => {
        if (!vaultTokenContract) return;

        // if we're on the vault token detail screen, don't navigate
        if (vaultTokenContract === tokenContract) return;

        // for promo, we want to navigate to the earn tab screen
        if (variant === 'promo') {
            navigation.popTo(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.EarnStack,
                params: { screen: EarnStackRoutes.Earn },
            });

            return;
        }

        // otherwise navigate to the vault token detail screen
        navigation.push(RootStackRoutes.AccountDetail, {
            accountKey: account.key,
            tokenContract: toTokenAddress(vaultTokenContract),
            closeActionType: 'back',
        });
    };

    return (
        <Pressable onPress={goToVault} disabled={!vaultTokenContract}>
            <Badge
                intent={intent}
                size="small"
                label={<Translation id={translationId} values={{ apy }} />}
            />
        </Pressable>
    );
};
