import { type ReactNode } from 'react';

import styled from 'styled-components';

import { events } from '@suite/analytics';
import { selectLanguage } from '@suite/settings';
import { type GuideNode as GuideNodeType } from '@suite-common/suite-types';
import { Icon } from '@trezor/components';
import { resolveStaticPath } from '@trezor/env-utils';
import { borders, spacings, transitions, typography } from '@trezor/theme';

import { openNode } from 'src/actions/suite/guideActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';
import { getNodeTitle } from 'src/utils/suite/guide';

const NodeButton = styled.button`
    display: flex;
    align-items: center;
    border-radius: ${borders.radii.xs};
    border: 0;
    width: 100%;
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    padding: 10px;
    cursor: pointer;
    line-height: 1.57;
    transition: background ${transitions.speed.normal} ${transitions.type};

    &:hover,
    &:focus {
        background: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation1};
    }
`;

const PageNodeButton = styled(NodeButton)`
    text-align: left;
`;

const Label = styled.div<{ $isBold: boolean }>`
    width: 100%;
    ${({ $isBold }) => ($isBold ? typography['body-sm'] : typography['body-sm-strong'])};
    color: ${({ theme }) => theme.textDefault};
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

const CategoryNodeButton = styled(NodeButton)`
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 140px;
    text-align: center;
    height: 150px;
    flex: 1;
`;

const Image = styled.img`
    width: 64px;
`;

type GuideNodeProps = {
    node: GuideNodeType;
    description?: ReactNode;
};

export const GuideNode = ({ node, description }: GuideNodeProps) => {
    const language = useSelector(selectLanguage);
    const dispatch = useDispatch();
    const analytics = useAnalytics();

    const navigateToNode = () => {
        dispatch(openNode(node));
        analytics.report({
            type: events.guideNodeNavigationEvent.name,
            payload: {
                type: node.type,
                id: node.id,
            },
        });
    };

    const label = (
        <Label $isBold={!description}>
            {getNodeTitle(node, language)}
            {description}
        </Label>
    );

    if (node.type === 'page') {
        return (
            <PageNodeButton data-testid={`@guide/node${node.id}`} onClick={navigateToNode}>
                <Icon
                    name="article"
                    size={20}
                    intent="neutral"
                    priority="secondary"
                    margin={{ right: spacings.md }}
                />
                {label}
            </PageNodeButton>
        );
    }

    if (node.type === 'category') {
        return (
            <CategoryNodeButton data-testid={`@guide/category${node.id}`} onClick={navigateToNode}>
                {node.image && <Image src={resolveStaticPath(node.image)} />}
                {label}
            </CategoryNodeButton>
        );
    }

    return null;
};
