import { ReactNode } from 'react';

import { Row, Text } from '@trezor/components';

import { Translation, TranslationKey, isTranslationKey } from 'src/components/suite/Translation';

export type AssetGroupLabelProps = {
    label: ReactNode | TranslationKey;
};

export function AssetGroupLabel({ label }: AssetGroupLabelProps) {
    return (
        <Row padding={{ horizontal: 8 }}>
            <Text typographyStyle="hint" variant="default" as="div" ellipsisLineCount={1}>
                {isTranslationKey(label) ? <Translation id={label} /> : label}
            </Text>
        </Row>
    );
}
