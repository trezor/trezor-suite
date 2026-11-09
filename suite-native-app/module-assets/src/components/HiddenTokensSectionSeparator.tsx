import { WalletAssetCardSegment } from '@suite-native/assets';
import { Divider } from '@suite-native/atoms';

import { type HiddenTokensListEntry } from '../hiddenTokensListSelectors';

type HiddenTokensSectionSeparatorProps = {
    trailingItem?: HiddenTokensListEntry;
};

export const HiddenTokensSectionSeparator = ({
    trailingItem,
}: HiddenTokensSectionSeparatorProps) =>
    trailingItem?.type === 'section-header' ? (
        <WalletAssetCardSegment>
            <Divider />
        </WalletAssetCardSegment>
    ) : null;
