import { type ReactNode } from 'react';

import { Translation, type TranslationKey, isTranslationKey } from '@suite/intl';
import { Row, Text, type TextProps } from '@trezor/components';

export type AssetGroupLabelProps = {
    label: ReactNode | TranslationKey;
    priority?: TextProps['priority'];
    'data-testid'?: string;
};

export function AssetGroupLabel({
    label,
    priority,
    'data-testid': dataTestId,
}: AssetGroupLabelProps) {
    return (
        <Row padding={{ horizontal: 8 }} data-testid={dataTestId}>
            <Text
                typographyStyle="body-sm"
                intent="neutral"
                as="div"
                priority={priority}
                ellipsisLineCount={1}
            >
                {isTranslationKey(label) ? <Translation id={label} /> : label}
            </Text>
        </Row>
    );
}
