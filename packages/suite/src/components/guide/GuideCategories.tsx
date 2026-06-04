import { type ReactNode } from 'react';

import { type GuideCategory } from '@suite-common/suite-types';
import { Box, CardList, Column } from '@trezor/components';

import { GuideNode } from './GuideNode';
import { GuideSectionHeadline } from './GuideSectionHeadline';

type GuideCategoriesProps = {
    node: GuideCategory | null;
    label?: string | ReactNode;
    variant?: 'default' | 'cardList';
};

export const GuideCategories = ({ node, label, variant = 'default' }: GuideCategoriesProps) => {
    if (node?.type !== 'category') {
        return null;
    }

    const children = node.children.map(child => (
        <GuideNode key={child.id} node={child} itemVariant={variant} />
    ));

    return (
        <Box as="section" padding={{ bottom: 20 }}>
            {label && <GuideSectionHeadline>{label}</GuideSectionHeadline>}
            {variant === 'cardList' ? (
                <CardList data-testid="@guide/nodes">{children}</CardList>
            ) : (
                <Column gap={12} data-testid="@guide/nodes">
                    {children}
                </Column>
            )}
        </Box>
    );
};
