import { type ReactNode, useCallback, useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import { selectHiddenWalletAssetKeys } from '@suite-common/assets';
import { type HiddenTokenReason, type WalletAssetKey } from '@suite-common/wallet-core';
import { Box, Card, Column, Divider, Row, Text, VirtualizedList } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import {
    HIDDEN_TOKEN_BALANCE_WIDTH,
    HIDDEN_TOKEN_PRICE_WIDTH,
    HIDDEN_TOKEN_ROW_HEIGHT,
    HIDDEN_TOKEN_ROW_PADDING,
    HiddenTokenRow,
} from './HiddenTokenRow';
import { UnhideAssetModal } from './UnhideAssetModal';

const LIST_MAX_ROW_COUNT = 9;

const LIST_MIN_WIDTH = 480;

const SEPARATOR_HEIGHT = 1;
const ITEM_HEIGHT = HIDDEN_TOKEN_ROW_HEIGHT + SEPARATOR_HEIGHT;

type HiddenTokenItem = {
    assetKey: WalletAssetKey;
    height: number;
};

type HiddenTokensCardProps = {
    heading: ReactNode;
    reason: HiddenTokenReason;
    'data-testid': string;
};

export const HiddenTokensCard = ({
    heading,
    reason,
    'data-testid': dataTestId,
}: HiddenTokensCardProps) => {
    const assetKeys = useSelector(state => selectHiddenWalletAssetKeys(state, reason));
    const [assetKeyToUnhide, setAssetKeyToUnhide] = useState<WalletAssetKey>();
    const items = useMemo(
        () => assetKeys.map(assetKey => ({ assetKey, height: ITEM_HEIGHT })),
        [assetKeys],
    );
    const getItemKey = useCallback((item: HiddenTokenItem) => item.assetKey, []);
    const renderItem = useCallback(
        ({ assetKey }: HiddenTokenItem) => (
            <>
                <Divider margin={0} strokeWidth={SEPARATOR_HEIGHT} />
                <HiddenTokenRow assetKey={assetKey} onSelect={setAssetKeyToUnhide} />
            </>
        ),
        [],
    );

    if (assetKeys.length === 0) {
        return null;
    }

    return (
        <Card paddingType="none" data-testid={dataTestId}>
            <Column alignItems="stretch">
                <Text
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    margin={{ top: 16, left: 20 }}
                >
                    {heading}
                </Text>
                <Box overflow="auto">
                    <Column minWidth={LIST_MIN_WIDTH}>
                        <Row gap={16} padding={HIDDEN_TOKEN_ROW_PADDING}>
                            <Text
                                typographyStyle="body-sm"
                                intent="neutral"
                                priority="secondary"
                                flex="1"
                            >
                                <Translation id="TR_ASSET" />
                            </Text>
                            <Text
                                typographyStyle="body-sm"
                                intent="neutral"
                                priority="secondary"
                                width={HIDDEN_TOKEN_PRICE_WIDTH}
                                align="end"
                            >
                                <Translation id="TR_EXCHANGE_RATE" />
                            </Text>
                            <Text
                                typographyStyle="body-sm"
                                intent="neutral"
                                priority="secondary"
                                width={HIDDEN_TOKEN_BALANCE_WIDTH}
                                align="end"
                            >
                                <Translation id="TR_BALANCE" />
                            </Text>
                        </Row>
                        <VirtualizedList
                            items={items}
                            renderItem={renderItem}
                            getItemKey={getItemKey}
                            listHeight={Math.min(items.length, LIST_MAX_ROW_COUNT) * ITEM_HEIGHT}
                            listMinHeight={0}
                            resetScrollOnItemsChange={false}
                        />
                    </Column>
                </Box>
            </Column>

            {assetKeyToUnhide !== undefined && (
                <UnhideAssetModal
                    assetKey={assetKeyToUnhide}
                    reason={reason}
                    onCancel={() => setAssetKeyToUnhide(undefined)}
                />
            )}
        </Card>
    );
};
