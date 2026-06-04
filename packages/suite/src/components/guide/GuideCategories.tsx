import { type ReactNode } from 'react';

import { type GuideCategory } from '@suite-common/suite-types';
import { Box, CardList } from '@trezor/components';

import { GuideNode } from './GuideNode';
import { GuideSectionHeadline } from './GuideSectionHeadline';

type GuideCategoriesProps = {
    node: GuideCategory | null;
    label?: string | ReactNode;
};

export const GuideCategories = ({ node, label }: GuideCategoriesProps) => {
    if (node?.type !== 'category') {
        return null;
    }

    return (
        <Box as="section" padding={{ bottom: 20 }}>
            {label && <GuideSectionHeadline>{label}</GuideSectionHeadline>}
            <CardList data-testid="@guide/nodes">
                {node.children.map(child => (
                    <GuideNode key={child.id} node={child} />
                ))}
            </CardList>
        </Box>
    );
};
