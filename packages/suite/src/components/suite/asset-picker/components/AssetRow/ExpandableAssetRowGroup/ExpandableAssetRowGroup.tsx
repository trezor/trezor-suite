import { Fragment, type ReactNode } from 'react';

import styled from 'styled-components';

import { Translation, type TranslationKey } from '@suite/intl';
import { Box, Card, Collapsible, Row, Text } from '@trezor/components';
import { CaretUpDownIcon, CaretUpDownReverseIcon } from '@trezor/icons';
import { TokenIconSet, type TokenIconSetToken } from '@trezor/product-components';

import { type AccountWithOptionalLabel, type AssetRowOption } from '../../../types';
import {
    getExpandableGroupContentHeight,
    getExpandableGroupHeight,
} from '../../../utils/assetPickerItemHeights';

const GROUP_VISIBLE_ICON_COUNT = 2;

// Don't use `Collapsible.Content`, it's not optimized for larger content.
// Use this custom component, thanks to 'will-change' it acts as single layer.
const CollapsibleContent = styled.div<{ $contentHeight: number; $expanded: boolean }>`
    will-change: opacity;
    height: ${({ $contentHeight }) => $contentHeight}px;
    overflow: hidden;
    position: relative;
    transition: opacity 350ms ease-out;
    opacity: ${({ $expanded }) => ($expanded ? 1 : 0)};
`;

const getIconSetToken = (item: AssetRowOption): TokenIconSetToken =>
    item.type === 'token'
        ? { contract: item.token.contract, symbol: item.token.symbol }
        : { symbol: item.account.symbol };

const getItemKey = (item: AssetRowOption) =>
    item.type === 'token' ? `${item.account.key}/${item.token.contract}` : item.account.key;

export type ExpandableAssetRowGroupProps = {
    label: TranslationKey;
    account: AccountWithOptionalLabel;
    items: AssetRowOption[];
    renderItem: (item: AssetRowOption) => ReactNode;
    expanded: boolean;
    onExpandToggle: (expanded: boolean) => void;
    dataTestId?: string;
};

export function ExpandableAssetRowGroup({
    label,
    account,
    items,
    renderItem,
    expanded,
    onExpandToggle,
    dataTestId,
}: ExpandableAssetRowGroupProps) {
    const contentHeight = expanded ? getExpandableGroupContentHeight(items.length) : 0;

    return (
        <Collapsible isOpen={expanded} data-testid={dataTestId}>
            <Box padding={2} height={getExpandableGroupHeight(expanded, items.length)}>
                <Card type="contrast" paddingType="none">
                    <Collapsible.Toggle
                        onClick={() => {
                            // The operation will be probably expensive. Ask for fresh frame before switching the state.
                            requestAnimationFrame(() => {
                                onExpandToggle(!expanded);
                            });
                        }}
                        data-testid={dataTestId ? `${dataTestId}/toggle` : undefined}
                    >
                        <Row
                            alignItems="center"
                            justifyContent="space-between"
                            gap={12}
                            padding={{
                                vertical: 12,
                                horizontal: 16,
                            }}
                        >
                            <Text typographyStyle="body-sm">
                                <Translation id={label} />
                            </Text>

                            <Row alignItems="center" gap={12}>
                                {!expanded && (
                                    <TokenIconSet
                                        symbol={account.symbol}
                                        tokens={items.map(getIconSetToken)}
                                        size={24}
                                        gap={20}
                                        maxVisibleIcons={GROUP_VISIBLE_ICON_COUNT}
                                        isCentered={false}
                                        isCountVisible
                                        isReversed={false}
                                    />
                                )}

                                <Collapsible.ToggleIcon
                                    icon={expanded ? CaretUpDownReverseIcon : CaretUpDownIcon}
                                />
                            </Row>
                        </Row>
                    </Collapsible.Toggle>

                    <CollapsibleContent $contentHeight={contentHeight} $expanded={expanded}>
                        {expanded &&
                            items.map(item => (
                                <Fragment key={getItemKey(item)}>{renderItem(item)}</Fragment>
                            ))}
                    </CollapsibleContent>
                </Card>
            </Box>
        </Collapsible>
    );
}
