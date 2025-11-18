import { ReactNode, memo } from 'react';

import { Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

export const ASSET_ROW_GROUP_LABEL_HEIGHT = 24;

export type AssetGroupLabelProps = {
    label: ReactNode;
};

export const AssetGroupLabel = memo(function AssetGroupLabelInner({ label }: AssetGroupLabelProps) {
    return (
        <Text
            typographyStyle="hint"
            variant="default"
            margin={{ bottom: spacings.xxs, left: spacings.md }}
            as="div"
        >
            {label}
        </Text>
    );
});
