import { type ReactNode } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { H2, Row } from '@trezor/components';
type WalletSubpageHeadingProps = {
    title: TranslationKey;
    children?: ReactNode;
    'data-testid'?: string;
};

export const WalletSubpageHeading = ({
    title,
    children,
    'data-testid': dataTestId,
}: WalletSubpageHeadingProps) => (
    <Row justifyContent="space-between">
        <H2 data-testid={dataTestId}>
            <Translation id={title} />
        </H2>
        <Row gap={8}>{children}</Row>
    </Row>
);
