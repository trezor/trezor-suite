import { type ReactNode } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { Paragraph } from '@trezor/components';

type GuideSectionHeadlineProps = {
    id?: TranslationKey;
    children?: ReactNode;
};

export const GuideSectionHeadline = ({ id, children }: GuideSectionHeadlineProps) => (
    <Paragraph
        as="h3"
        typographyStyle="body-md"
        intent="neutral"
        priority="secondary"
        padding={{ bottom: 16 }}
    >
        {children ?? (id && <Translation id={id} />)}
    </Paragraph>
);
