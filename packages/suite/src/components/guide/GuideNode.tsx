import { ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';
import { analytics, EventType } from '@trezor/suite-analytics';
import { resolveStaticPath } from '@suite-common/suite-utils';

import { Icon, variables } from '@trezor/components';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openNode } from 'src/actions/suite/guideActions';
import { GuideNode as GuideNodeType } from '@suite-common/suite-types';
import { getNodeTitle } from 'src/utils/suite/guide';
import { borders } from '@trezor/theme';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';

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
    transition: ${({ theme }) =>
        `background ${theme.HOVER_TRANSITION_TIME} ${theme.HOVER_TRANSITION_EFFECT}`};

    :hover,
    :focus {
        background: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation1};
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
