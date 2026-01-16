import { ReactNode } from 'react';

import { Translation, TranslationKey } from '@suite/intl';
import { H2, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

type WalletSubpageHeadingProps = {
    title: TranslationKey;
    children?: ReactNode;
};

export const WalletSubpageHeading = ({ title, children }: WalletSubpageHeadingProps) => (
    <Row justifyContent="space-between">
        <H2>
            <Translation id={title} />
        </H2>
        <Row gap={spacings.xs}>{children}</Row>
    </Row>
);
