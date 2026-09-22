import { useMemo } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { selectDeviceStaticSessionId } from '@suite-common/device';
import { ExperimentId, useExperiment } from '@suite-common/message-system';
import { Column, Text } from '@trezor/components';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout, useSelector } from 'src/hooks/suite';

import { HiddenTokensCard } from './HiddenTokensCard';
import {
    selectHiddenByUserAssets,
    selectHiddenByUserDustRows,
    selectUnrecognizedAssets,
    selectUnrecognizedDustRows,
} from './hiddenTokensSelectors';

const EMPTY_ASSETS = [] as const;

export const HiddenTokens = () => {
    const { activeExperimentVariant } = useExperiment(ExperimentId.assetFirstHomeTable);
    const deviceState = useSelector(selectDeviceStaticSessionId);
    const hiddenByUser = useSelector(state =>
        deviceState === null ? EMPTY_ASSETS : selectHiddenByUserAssets(state, deviceState),
    );
    const unrecognized = useSelector(state =>
        deviceState === null ? EMPTY_ASSETS : selectUnrecognizedAssets(state, deviceState),
    );
    const hiddenByUserDust = useSelector(state =>
        deviceState === null ? EMPTY_ASSETS : selectHiddenByUserDustRows(state, deviceState),
    );
    const unrecognizedDust = useSelector(state =>
        deviceState === null ? EMPTY_ASSETS : selectUnrecognizedDustRows(state, deviceState),
    );

    const { translationString } = useTranslation();
    const pageHeader = useMemo(() => <PageHeader />, []);

    useLayout(translationString('TR_HIDDEN_TOKENS'), pageHeader);

    // The page belongs to the asset-first table, and the route is only linked from it: typing the
    // address is no way into a page the experiment did not give you.
    if (activeExperimentVariant?.variant !== 'B') {
        return null;
    }

    if (
        hiddenByUser.length === 0 &&
        unrecognized.length === 0 &&
        hiddenByUserDust.length === 0 &&
        unrecognizedDust.length === 0
    ) {
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
                assets={hiddenByUser}
                dustRows={hiddenByUserDust}
                data-testid="@hidden-tokens/hidden-by-user"
            />
            <HiddenTokensCard
                heading={<Translation id="TR_TOKEN_UNRECOGNIZED_BY_TREZOR" />}
                assets={unrecognized}
                dustRows={unrecognizedDust}
                data-testid="@hidden-tokens/unrecognized"
            />
        </Column>
    );
};
