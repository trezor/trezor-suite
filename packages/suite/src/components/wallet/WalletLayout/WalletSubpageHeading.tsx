import { ReactNode } from 'react';

import { H2, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { TranslationKey } from 'src/components/suite/Translation';

type WalletSubpageHeadingProps = {
    title: TranslationKey;
    children?: ReactNode;
};

export const WalletSubpageHeading = ({ title, children }: WalletSubpageHeadingProps) => (
    <Row justifyContent="space-between" margin={{ bottom: spacings.lg }}>
        <H2>
            <Translation id={title} />
        </H2>
        <Row gap={spacings.xxs}>{children}</Row>
    </Row>
);
