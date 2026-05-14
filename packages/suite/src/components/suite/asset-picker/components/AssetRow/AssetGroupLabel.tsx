import { type ReactNode } from 'react';

import { Translation, type TranslationKey, isTranslationKey } from '@suite/intl';
import { Row, Text } from '@trezor/components';

export const ASSET_ROW_GROUP_LABEL_HEIGHT = 24;

export type AssetGroupLabelProps = {
    label: ReactNode | TranslationKey;
};

export function AssetGroupLabel({ label }: AssetGroupLabelProps) {
    return (
        <Row padding={{ horizontal: 8 }}>
            <Text typographyStyle="body-sm" intent="neutral" as="div" ellipsisLineCount={1}>
                {isTranslationKey(label) ? <Translation id={label} /> : label}
            </Text>
        </Row>
    );
}
