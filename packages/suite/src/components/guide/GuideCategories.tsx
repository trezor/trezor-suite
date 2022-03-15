import React, { ReactNode } from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';
import { Category } from '@suite-types/guide';
import { GuideNode } from '@guide-components';

const Section = styled.section`
    padding: 8px 0 0 0;
`;

const SectionHeading = styled.h3`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    padding: 0 0 18px 0;
`;

const Nodes = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
`;

type GuideCategoriesProps = {
    node: Category | null;
    label: string | ReactNode;
};

export const GuideCategories: React.FC<GuideCategoriesProps> = ({ node, label }) => {
    if (!node || node.type !== 'category') {
        return null;
    }

    return (
        <Section>
            <SectionHeading>{label}</SectionHeading>
            <Nodes data-test="@guide/nodes">
                {node.children.map(child => (
                    <GuideNode key={child.id} node={child} />
                ))}
            </Nodes>
        </Section>
    );
};
