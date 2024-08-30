import { getPagesUnderRoute } from 'nextra/context';
import Link from 'next/link';
import { ReactNode } from 'react';

import { Card as TrezorCard, H3, Paragraph, Button } from '@trezor/components';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';

const SectionCard = styled(TrezorCard)`
    margin-bottom: ${spacingsPx.xl};
`;

const BottomRow = styled.div`
    margin-top: ${spacingsPx.sm};
`;

interface Page {
    route: string;
    meta?: {
        title?: string;
    };
    frontMatter?: {
        title?: string;
        description?: string;
        date?: string;
    };
    name: string;
}

export default function GuideIndex(): ReactNode {
    const pages: Page[] = getPagesUnderRoute('/guides');

    return pages.map(page => {
        return (
            <Link
                href={page.route}
                style={{ color: 'inherit', textDecoration: 'none' }}
                key={page.route}
            >
                <SectionCard>
                    <H3>{page.meta?.title || page.frontMatter?.title || page.name}</H3>
                    <Paragraph>{page.frontMatter?.description}</Paragraph>
                    <BottomRow>
                        <Button
                            variant="primary"
                            size="tiny"
                            icon="arrowRight"
                            iconAlignment="right"
                        >
                            Read more
                        </Button>
                    </BottomRow>
                </SectionCard>
            </Link>
        );
    });
}
