import { useSelector } from 'react-redux';

import {
    type HomeAssetTableState,
    selectWalletAssetAccountCount,
    selectWalletAssetKey,
} from '@suite-common/assets';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useServices } from '@trezor/dependency-injection';

import { AssetSettingsAction } from './AssetSettingsAction';

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
    const { analytics } = useServices(injectNativeAnalytics);

    const openAccounts = () => {
        analytics.report({
            type: events.navigateFlowEvent.name,
            payload: { action: 'navigate', type: 'account-list', from: 'menu', networkSymbol },
        });
        onOpenAccounts();
    };

    return (
        <AssetSettingsAction
            iconName="wallet"
            label={<Translation id="moduleAssets.assetDetailScreen.settings.accounts" />}
            onPress={openAccounts}
            testID="@asset-detail/settings/accounts-button"
            rightContent={
                <HStack alignItems="center" spacing="sp16">
                    <Text variant="body-sm">{accountsCount}</Text>
                    <Icon name="caretRight" color="contentSecondary" size="mediumLarge" />
                </HStack>
            }
        />
    );
};
