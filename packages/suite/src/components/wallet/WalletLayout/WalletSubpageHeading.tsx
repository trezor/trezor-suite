import { ReactNode } from 'react';

import { H2, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { TranslationKey, Translation } from 'src/components/suite/Translation';

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
