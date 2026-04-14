import { type ReactNode } from 'react';

import styled from 'styled-components';

import { type GuideCategory } from '@suite-common/suite-types';
import { typography } from '@trezor/theme';

import { GuideNode } from 'src/components/guide';

const Section = styled.section`
    padding-bottom: 20px;
`;

const SectionHeading = styled.h3`
    ${typography['body-sm-strong']}
    color: ${({ theme }) => theme.contentSecondary};
    padding: 0 0 18px;
`;

const Nodes = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
`;

type GuideCategoriesProps = {
    node: GuideCategory | null;
    label?: string | ReactNode;
};

export const GuideCategories = ({ node, label }: GuideCategoriesProps) => {
    if (!node || node.type !== 'category') {
        return null;
    }

    return (
        <Section>
            {label && <SectionHeading>{label}</SectionHeading>}
            <Nodes data-testid="@guide/nodes">
                {node.children.map(child => (
                    <GuideNode key={child.id} node={child} />
                ))}
            </Nodes>
        </Section>
    );
};
