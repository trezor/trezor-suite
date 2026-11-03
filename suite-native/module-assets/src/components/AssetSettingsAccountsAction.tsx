import { useSelector } from 'react-redux';

import {
    type HomeAssetTableState,
    selectWalletAssetAccountCount,
    selectWalletAssetKey,
} from '@suite-common/assets';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type AssetSettingsAccountsActionProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    onOpenAccounts: () => void;
};

export const AssetSettingsAccountsAction = ({
    networkSymbol,
    tokenContract,
    onOpenAccounts,
}: AssetSettingsAccountsActionProps) => {
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const accountsCount = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetAccountCount(state, assetKey),
    );

    return (
        <PressableOpacity
            accessibilityRole="button"
            onPress={onOpenAccounts}
            testID="@asset-detail/settings/accounts-button"
        >
            <HStack alignItems="center" justifyContent="space-between" paddingVertical="sp12">
                <HStack alignItems="center" spacing="sp16">
                    <Icon name="wallet" size="medium" />
                    <Text variant="body-md">
                        <Translation id="moduleAssets.assetDetailScreen.settings.accounts" />
                    </Text>
                </HStack>
                <HStack alignItems="center" spacing="sp16">
                    <Text variant="body-md">{accountsCount}</Text>
                    <Icon name="caretRight" color="contentSecondary" size="mediumLarge" />
                </HStack>
            </HStack>
        </PressableOpacity>
    );
};
