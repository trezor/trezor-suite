import { AccountLabel } from '@suite-native/accounts';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type MyAsset } from '@suite-native/trading-types';

import { MyAssetGroup } from './MyAssetGroup';
import { MyAssetListItem } from './MyAssetListItem';
import { type MyAssetsSection } from '../../../hooks/general/useMyAssetsFilteredData';

type MyAssetListSectionProps = {
    index: number;
    onAssetSelect: (asset: MyAsset, account: MyAssetsSection['sectionData']) => void;
    section: MyAssetsSection;
    testID?: string;
};

export const MyAssetListSection = ({
    index,
    onAssetSelect,
    section,
    testID,
}: MyAssetListSectionProps) => {
    const hasLowBalanceAssets = section.lowBalanceAssets.length > 0;
    const hasNonTradableAssets = section.nonTradableAssets.length > 0;

    return (
        <VStack spacing="sp8" paddingTop={index === 0 ? undefined : 'sp32'}>
            <AccountLabel
                account={section.sectionData}
                variant="body-md-strong"
                color="contentPrimary"
            />
            {section.assets.map(asset => (
                <MyAssetListItem
                    key={`${asset.symbol}_${asset.contract ?? asset.cryptoId}`}
                    asset={asset}
                    onPress={() => onAssetSelect(asset, section.sectionData)}
                />
            ))}
            {(hasLowBalanceAssets || hasNonTradableAssets) && (
                <VStack
                    spacing={0}
                    testID={testID ? `${testID}/${section.sectionData.key}/groups` : undefined}
                >
                    {hasLowBalanceAssets && (
                        <MyAssetGroup
                            assets={section.lowBalanceAssets}
                            isLast={!hasNonTradableAssets}
                            onAssetSelect={asset => onAssetSelect(asset, section.sectionData)}
                            title={<Translation id="moduleTrading.myAssetScreen.lowBalance" />}
                            testID={
                                testID
                                    ? `${testID}/${section.sectionData.key}/low-balance`
                                    : undefined
                            }
                        />
                    )}
                    {hasNonTradableAssets && (
                        <MyAssetGroup
                            assets={section.nonTradableAssets}
                            isFirst={!hasLowBalanceAssets}
                            onAssetSelect={asset => onAssetSelect(asset, section.sectionData)}
                            title={<Translation id="moduleTrading.myAssetScreen.nonTradeable" />}
                            testID={
                                testID
                                    ? `${testID}/${section.sectionData.key}/non-tradeable`
                                    : undefined
                            }
                        />
                    )}
                </VStack>
            )}
        </VStack>
    );
};
