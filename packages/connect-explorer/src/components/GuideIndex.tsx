import { type ReactNode } from 'react';

import Link from 'next/link';
import { getPagesUnderRoute } from 'nextra/context';
import styled from 'styled-components';

import { Button, Card, H3, Paragraph } from '@trezor/components';
import { ArrowLineUpRightIcon } from '@trezor/icons';
const BottomRow = styled.div`
    margin-top: 12px;
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

    return pages.map(page => (
        <Link
            href={page.route}
            style={{ color: 'inherit', textDecoration: 'none' }}
            key={page.route}
        >
            <Card margin={{ bottom: 24 }}>
                <H3>{page.meta?.title || page.frontMatter?.title || page.name}</H3>
                <Paragraph>{page.frontMatter?.description}</Paragraph>
                <BottomRow>
                    <Button
                        intent="neutral"
                        priority="secondary"
                        size="small"
                        iconRight={ArrowLineUpRightIcon}
                    >
                        Read more
                    </Button>
                </BottomRow>
            </Card>
        </Link>
    ));
}
