import { useState } from 'react';

import { Translation } from '@suite/intl';
import { selectIsNftSectionEnabled } from '@suite/settings';
import {
    selectHiddenNftCollectionCount,
    selectShownNftCollectionCount,
} from '@suite-common/assets';
import { Card, Collapsible, Column, Row, SubTabs, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { HomeAssetNftTable } from './HomeAssetNftTable';

type NftTab = 'shown' | 'hidden';

type GetOpenTabParams = {
    chosenTab: NftTab;
    shownCount: number;
    hiddenCount: number;
};

// A wallet holding only airdropped spam has nothing to show, so the section opens where it has.
const getOpenTab = ({ chosenTab, shownCount, hiddenCount }: GetOpenTabParams): NftTab => {
    if (chosenTab === 'shown' && shownCount === 0) {
        return 'hidden';
    }

    if (chosenTab === 'hidden' && hiddenCount === 0) {
        return 'shown';
    }

    return chosenTab;
};

export const HomeAssetNfts = () => {
    const isNftSectionEnabled = useSelector(selectIsNftSectionEnabled);
    // Users who did not turn NFTs on must not pay for gathering them. The collapsed section reads
    // only the counts; the collections themselves are gathered by the table once it is open.
    const shownCount = useSelector(state =>
        isNftSectionEnabled ? selectShownNftCollectionCount(state) : 0,
    );
    const hiddenCount = useSelector(state =>
        isNftSectionEnabled ? selectHiddenNftCollectionCount(state) : 0,
    );
    const [chosenTab, setChosenTab] = useState<NftTab>('shown');

    if (shownCount === 0 && hiddenCount === 0) {
        return null;
    }

    const tab = getOpenTab({ chosenTab, shownCount, hiddenCount });

    return (
        <Card paddingType="none" data-testid="@dashboard/home-asset-nfts">
            <Collapsible>
                <Collapsible.Toggle data-testid="@dashboard/home-asset-nfts/toggle">
                    <Row
                        justifyContent="space-between"
                        alignItems="center"
                        padding={{ vertical: 16, horizontal: 20 }}
                    >
                        <Row gap={8} alignItems="baseline">
                            <Text typographyStyle="body-md-strong">
                                <Translation id="TR_NAV_NFTS" />
                            </Text>
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <Translation
                                    id="TR_HOME_ASSET_NFT_SUMMARY"
                                    values={{ collections: shownCount, hidden: hiddenCount }}
                                />
                            </Text>
                        </Row>
                        <Collapsible.ToggleIcon size={16} />
                    </Row>
                </Collapsible.Toggle>

                <Collapsible.Content>
                    <Column alignItems="stretch">
                        <Row
                            justifyContent="space-between"
                            alignItems="center"
                            padding={{ horizontal: 20, bottom: 8 }}
                        >
                            <SubTabs activeItemId={tab} size="small">
                                <SubTabs.Item
                                    id="shown"
                                    count={shownCount}
                                    onClick={() => setChosenTab('shown')}
                                    data-testid="@dashboard/home-asset-nfts/shown"
                                >
                                    <Translation id="TR_COLLECTIONS" />
                                </SubTabs.Item>
                                <SubTabs.Item
                                    id="hidden"
                                    count={hiddenCount}
                                    onClick={() => setChosenTab('hidden')}
                                    data-testid="@dashboard/home-asset-nfts/hidden"
                                >
                                    <Translation id="TR_HIDDEN" />
                                </SubTabs.Item>
                            </SubTabs>
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <Translation id="TR_HOME_ASSET_NFT_VIEW_ONLY" />
                            </Text>
                        </Row>

                        <HomeAssetNftTable isHidden={tab === 'hidden'} />
                    </Column>
                </Collapsible.Content>
            </Collapsible>
        </Card>
    );
};
