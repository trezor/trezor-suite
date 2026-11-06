import { useSelector } from 'react-redux';

import { type AssetsRootState, selectAssetTokenInfo } from '@suite-common/assets';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { AssetDetailAddressField } from './AssetDetailAddressField';

type AssetSettingsTokenDetailsSectionProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const AssetSettingsTokenDetailsSection = ({
    networkSymbol,
    tokenContract,
}: AssetSettingsTokenDetailsSectionProps) => {
    const tokenInfo = useSelector((state: AssetsRootState) =>
        selectAssetTokenInfo(state, networkSymbol, tokenContract),
    );

    if (!tokenInfo) return null;

    return (
        <VStack>
            {tokenInfo.policyId ? (
                <>
                    {tokenInfo.fingerprint && (
                        <AssetDetailAddressField
                            label={
                                <Translation id="transactionManagement.review.outputs.cardanoFingerprintLabel" />
                            }
                            value={tokenInfo.fingerprint}
                            testID="@asset-detail/settings/fingerprint"
                        />
                    )}
                    <AssetDetailAddressField
                        label={
                            <Translation id="moduleAssets.assetDetailScreen.settings.policyId" />
                        }
                        value={tokenInfo.policyId}
                        testID="@asset-detail/settings/policy-id"
                    />
                </>
            ) : (
                <AssetDetailAddressField
                    label={
                        <Translation id="moduleAccountManagement.tokenSettings.contractAddress" />
                    }
                    value={tokenInfo.contract}
                    testID="@asset-detail/settings/contract-address"
                />
            )}
        </VStack>
    );
};
