import { Translation } from '@suite/intl';
import { selectHasHiddenWalletAssets } from '@suite-common/assets';
import { Column, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { HiddenTokensCard } from './HiddenTokensCard';

export const HiddenTokensList = () => {
    const hasHiddenAssets = useSelector(selectHasHiddenWalletAssets);

    if (!hasHiddenAssets) {
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
                reason="hiddenByUser"
                data-testid="@hidden-tokens/hidden-by-user"
            />
            <HiddenTokensCard
                heading={<Translation id="TR_TOKEN_UNRECOGNIZED_BY_TREZOR" />}
                reason="unrecognized"
                data-testid="@hidden-tokens/unrecognized"
            />
        </Column>
    );
};
