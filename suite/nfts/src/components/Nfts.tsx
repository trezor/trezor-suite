import { useState } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { type SuiteSettingsRootState, selectIsNftSectionEnabled } from '@suite/settings';
import { Card, Collapsible, Column, Row, SubTabs, Text } from '@trezor/components';

import { NftList } from './NftList';
import {
    type NftState,
    selectHiddenNftCollectionCount,
    selectShownNftCollectionCount,
} from '../nftSelectors';

type NftTab = 'shown' | 'hidden';

type NftsToggle = {
    isOpen: boolean;
    collectionCount: number;
    hiddenCount: number;
};

type NftsProps = {
    onToggle?: (toggle: NftsToggle) => void;
};

export const Nfts = ({ onToggle }: NftsProps) => {
    const isNftSectionEnabled = useSelector(selectIsNftSectionEnabled);
    const shownCount = useSelector((state: NftState & SuiteSettingsRootState) =>
        isNftSectionEnabled ? selectShownNftCollectionCount(state) : 0,
    );
    const hiddenCount = useSelector((state: NftState & SuiteSettingsRootState) =>
        isNftSectionEnabled ? selectHiddenNftCollectionCount(state) : 0,
    );
    const [chosenTab, setChosenTab] = useState<NftTab>();
    const [isOpen, setIsOpen] = useState(false);

    if (shownCount === 0 && hiddenCount === 0) {
        return null;
    }

    const tab = chosenTab ?? (shownCount > 0 ? 'shown' : 'hidden');

    const toggle = () => {
        setIsOpen(!isOpen);
        onToggle?.({ isOpen: !isOpen, collectionCount: shownCount, hiddenCount });
    };

    return (
        <Card paddingType="none" data-testid="@dashboard/home-asset-nfts">
            <Collapsible isOpen={isOpen}>
                <Collapsible.Toggle
                    onClick={toggle}
                    data-testid="@dashboard/home-asset-nfts/toggle"
                >
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

                        <NftList key={tab} isHidden={tab === 'hidden'} />
                    </Column>
                </Collapsible.Content>
            </Collapsible>
        </Card>
    );
};
