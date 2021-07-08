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
    border-radius: 6px;
    border: 1px solid ${props => props.theme.STROKE_GREY};
    width: 100%;
    background: none;
    padding: 13px 17px;
    cursor: pointer;
    line-height: 1.57;
    transition: ${props =>
        `background ${props.theme.HOVER_TRANSITION_TIME} ${props.theme.HOVER_TRANSITION_EFFECT}`};

    &:hover {
        background: ${props => darken(props.theme.HOVER_DARKEN_FILTER, props.theme.BG_WHITE)};
    }
`;

const PageNodeButton = styled(NodeButton)`
    text-align: left;
    margin-bottom: 10px;
`;

const PageNodeButtonIcon = styled(Icon)`
    margin: 0 18px 0 0;
`;

const Label = styled.div`
    width: 100%;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const CategoryButtonNode = styled(NodeButton)`
    width: 142px;
    height: 70px;
    text-align: center;
    margin-bottom: 21px;
`;

type GuideNodeProps = {
    node: Node;
};

const GuideNode = ({ node }: GuideNodeProps) => {
    const theme = useTheme();
    const analytics = useAnalytics();

    const { openNode } = useActions({
        setView: guideActions.setView,
        openNode: guideActions.openNode,
    });
    const { language } = useSelector(state => ({
        language: state.suite.settings.language,
    }));

    const navigateToNode = (node: Node) => {
        openNode(node);
        analytics.report({
            type: 'guide/node/navigation',
            payload: {
                type: node.type,
                id: node.id,
            },
        });
    };

    const label = <Label>{getNodeTitle(node, language)}</Label>;

    if (node.type === 'page') {
        return (
            <PageNodeButton onClick={() => navigateToNode(node)}>
                <PageNodeButtonIcon icon="ARTICLE" size={20} color={theme.TYPE_LIGHT_GREY} />
                {label}
            </PageNodeButton>
        );
    }

    if (node.type === 'category') {
        return (
            <CategoryButtonNode onClick={() => navigateToNode(node)}>{label}</CategoryButtonNode>
        );
    }

    return null;
};

export default GuideNode;
