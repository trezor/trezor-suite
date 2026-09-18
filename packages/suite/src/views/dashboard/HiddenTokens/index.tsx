import { useMemo, useState } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { selectDeviceStaticSessionId } from '@suite-common/device';
import { Column, Text } from '@trezor/components';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout, useSelector } from 'src/hooks/suite';

import { HiddenTokensCard } from './HiddenTokensCard';
import { UnhideAssetModal } from './UnhideAssetModal';
import { selectHiddenByUserAssetRows, selectUnrecognizedAssetRows } from './hiddenTokensSelectors';
import { type AssetRow } from '../AssetFirstTable/assetFirstTableSelectors';

const EMPTY_ROWS = [] as const;

export const HiddenTokens = () => {
    const deviceState = useSelector(selectDeviceStaticSessionId);
    const hiddenByUser = useSelector(state =>
        deviceState === null ? EMPTY_ROWS : selectHiddenByUserAssetRows(state, deviceState),
    );
    const unrecognized = useSelector(state =>
        deviceState === null ? EMPTY_ROWS : selectUnrecognizedAssetRows(state, deviceState),
    );

    const [rowToUnhide, setRowToUnhide] = useState<AssetRow>();
    const { translationString } = useTranslation();
    const pageHeader = useMemo(() => <PageHeader />, []);

    useLayout(translationString('TR_HIDDEN_TOKENS'), pageHeader);

    if (hiddenByUser.length === 0 && unrecognized.length === 0) {
        return (
            <Text intent="neutral" priority="secondary" data-testid="@hidden-tokens/empty">
                <Translation id="TR_HIDDEN_TOKENS_EMPTY" />
            </Text>
        );
    }

    return (
        <Column gap={16} data-testid="@hidden-tokens">
            <HiddenTokensCard
                heading={<Translation id="TR_HIDDEN_TOKENS" />}
                rows={hiddenByUser}
                onUnhide={setRowToUnhide}
                data-testid="@hidden-tokens/hidden-by-user"
            />
            <HiddenTokensCard
                heading={<Translation id="TR_TOKEN_UNRECOGNIZED_BY_TREZOR" />}
                rows={unrecognized}
                onUnhide={setRowToUnhide}
                data-testid="@hidden-tokens/unrecognized"
            />

            {rowToUnhide !== undefined && (
                <UnhideAssetModal row={rowToUnhide} onCancel={() => setRowToUnhide(undefined)} />
            )}
        </Column>
    );
};
