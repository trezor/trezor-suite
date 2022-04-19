import React from 'react';
import styled from 'styled-components';
import { darken } from 'polished';

import { Icon, variables, useTheme } from '@trezor/components';
import { useActions, useSelector, useAnalytics } from '@suite-hooks';
import * as guideActions from '@suite-actions/guideActions';
import { Node } from '@suite-types/guide';
import { getNodeTitle } from '@suite-utils/guide';

const NodeButton = styled.button`
    display: flex;
    align-items: center;
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    width: 100%;
    background: none;
    padding: 10px;
    cursor: pointer;
    line-height: 1.57;
    transition: ${({ theme }) =>
        `background ${theme.HOVER_TRANSITION_TIME} ${theme.HOVER_TRANSITION_EFFECT}`};

    :hover,
    :focus {
        background: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, theme.BG_WHITE)};
    }
`;

const PageNodeButton = styled(NodeButton)`
    text-align: left;
    margin-bottom: 10px;
    align-items: flex-start;
`;

const PageNodeButtonIcon = styled(Icon)`
    margin: 0 18px 0 0;
`;

const Label = styled.div<{ isBold: boolean }>`
    width: 100%;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${({ isBold }) =>
        isBold ? variables.FONT_WEIGHT.DEMI_BOLD : variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
    overflow: hidden;
    line-height: 20px;
`;

const CategoryNodeButton = styled(NodeButton)`
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 142px;
    text-align: center;
    margin-bottom: 21px;
    height: 120px;
`;

const Image = styled.img`
    width: 64px;
    margin-bottom: 8px;
`;

type GuideNodeProps = {
    node: Node;
    description?: React.ReactNode;
};

export const GuideNode: React.FC<GuideNodeProps> = ({ node, description }) => {
    const { language } = useSelector(state => ({
        language: state.suite.settings.language,
    }));

    const theme = useTheme();
    const analytics = useAnalytics();

    const { openNode } = useActions({
        setView: guideActions.setView,
        openNode: guideActions.openNode,
    });

    const navigateToNode = () => {
        openNode(node);
        analytics.report({
            type: 'guide/node/navigation',
            payload: {
                type: node.type,
                id: node.id,
            },
        });
    };

    const label = (
        <Label isBold={!description}>
            {getNodeTitle(node, language)}
            {description}
        </Label>
    );

    if (node.type === 'page') {
        return (
            <PageNodeButton data-test={`@guide/node${node.id}`} onClick={navigateToNode}>
                <PageNodeButtonIcon icon="ARTICLE" size={20} color={theme.TYPE_LIGHT_GREY} />
                {label}
            </PageNodeButton>
        );
    }

    if (node.type === 'category') {
        return (
            <CategoryNodeButton data-test={`@guide/category${node.id}`} onClick={navigateToNode}>
                {node.image && <Image src={node.image} />}
                {label}
            </CategoryNodeButton>
        );
    }

    return null;
};
