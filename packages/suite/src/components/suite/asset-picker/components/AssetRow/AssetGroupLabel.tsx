import { ReactNode } from 'react';

import { Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation, TranslationKey, isTranslationKey } from 'src/components/suite/Translation';

export const ASSET_ROW_GROUP_LABEL_HEIGHT = 24;

export type AssetGroupLabelProps = {
    label: ReactNode | TranslationKey;
};

export function AssetGroupLabel({ label }: AssetGroupLabelProps) {
    return (
        <Text
            typographyStyle="hint"
            variant="default"
            margin={{ bottom: spacings.xxs, left: spacings.md }}
            as="div"
        >
            {isTranslationKey(label) ? <Translation id={label} /> : label}
        </Text>
    );
}
