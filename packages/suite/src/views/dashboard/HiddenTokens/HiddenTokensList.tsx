import { Translation } from '@suite/intl';
import { selectHasHiddenWalletAssets } from '@suite-common/assets';
import { Column } from '@trezor/components';

import { useDiscovery, useSelector } from 'src/hooks/suite';
import { AssetRowsSkeleton } from 'src/views/home/HomeAssetsTable/AssetRowsSkeleton';
import { NoTokens } from 'src/views/wallet/tokens/common/NoTokens';

import { HiddenTokensCard } from './HiddenTokensCard';

export const HiddenTokensList = () => {
    const hasHiddenAssets = useSelector(selectHasHiddenWalletAssets);
    const { isDiscoveryRunning } = useDiscovery();

    if (!hasHiddenAssets && isDiscoveryRunning) {
        return <AssetRowsSkeleton data-testid="@hidden-tokens/loading" />;
    }

    if (!hasHiddenAssets) {
        return (
            <NoTokens
                title={<Translation id="TR_HIDDEN_TOKENS_EMPTY" />}
                data-testid="@hidden-tokens/empty"
            />
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
