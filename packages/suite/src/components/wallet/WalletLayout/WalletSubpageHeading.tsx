import { type ReactNode } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { H2, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

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
        <Row gap={spacings.xs}>{children}</Row>
    </Row>
);
