import { type ReactNode } from 'react';

import { type GuideCategory } from '@suite-common/suite-types';
import { Box, Column, Paragraph } from '@trezor/components';

import { GuideNode } from 'src/components/guide';

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
            {label && (
                <Paragraph as="h3" typographyStyle="body-sm-strong" padding={{ bottom: 16 }}>
                    {label}
                </Paragraph>
            )}
            <Column gap={16} data-testid="@guide/nodes">
                {node.children.map(child => (
                    <GuideNode key={child.id} node={child} />
                ))}
            </Column>
        </Box>
    );
};
