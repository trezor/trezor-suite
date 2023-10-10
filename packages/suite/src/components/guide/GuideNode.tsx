import { ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';
import { darken } from 'polished';
import { analytics, EventType } from '@trezor/suite-analytics';
import { resolveStaticPath } from '@suite-common/suite-utils';

import { Icon, variables } from '@trezor/components';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openNode } from 'src/actions/suite/guideActions';
import { GuideNode as GuideNodeType } from '@suite-common/suite-types';
import { getNodeTitle } from 'src/utils/suite/guide';

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
`;

const PageNodeButtonIcon = styled(Icon)`
    margin: 0 18px 0 0;
`;

const Label = styled.div<{ isBold: boolean }>`
    width: 100%;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${({ isBold }) =>
        isBold ? variables.FONT_WEIGHT.DEMI_BOLD : variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    overflow: hidden;
    line-height: 16px;
    flex: 1;
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
    height: 120px;
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
    const language = useSelector(state => state.suite.settings.language);
    const dispatch = useDispatch();

    const theme = useTheme();

    const navigateToNode = () => {
        dispatch(openNode(node));
        analytics.report({
            type: EventType.GuideNodeNavigation,
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
                {node.image && <Image src={resolveStaticPath(node.image)} />}
                {label}
            </CategoryNodeButton>
        );
    }

    return null;
};
