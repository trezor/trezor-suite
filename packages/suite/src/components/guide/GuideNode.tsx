import { type ReactNode } from 'react';

import styled from 'styled-components';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { selectLanguage } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { type GuideNode as GuideNodeType } from '@suite-common/suite-types';
import { Card, Icon, IconCircle, type IconName, Paragraph, Row } from '@trezor/components';
import { resolveStaticPath } from '@trezor/env-utils';
import { borders, spacings, transitions, typography } from '@trezor/theme';

import { openNode } from 'src/actions/suite/guideActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { getNodeTitle } from 'src/utils/suite/guide';

const NodeButton = styled.button`
    display: flex;
    align-items: center;
    border-radius: ${borders.radii.xs};
    border: 0;
    width: 100%;
    background: ${({ theme }) => theme.elementFillElevated};
    padding: 10px;
    cursor: pointer;
    line-height: 1.57;
    transition: background ${transitions.speed.normal} ${transitions.type};

    &:hover,
    &:focus {
        background: ${({ theme }) => theme.elementFillElevatedHovered};
    }
`;

const PageNodeButton = styled(NodeButton)`
    text-align: left;
`;

const Label = styled.div<{ $isBold: boolean }>`
    width: 100%;
    ${({ $isBold }) => ($isBold ? typography['body-sm'] : typography['body-sm-strong'])};
    color: ${({ theme }) => theme.contentPrimary};
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

const CategoryImage = styled.img`
    width: 28px;
    height: 28px;
    object-fit: contain;
`;

type GuideNodeProps = {
    node: GuideNodeType;
    description?: ReactNode;
};

export const GuideNode = ({ node, description }: GuideNodeProps) => {
    const language = useSelector(selectLanguage);
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);

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
            <Card
                data-testid={`@guide/category${node.id}`}
                onClick={navigateToNode}
                paddingType="small"
            >
                <Row gap={16}>
                    {node.icon ? (
                        <IconCircle name={node.icon as IconName} size={40} intent="neutral" />
                    ) : (
                        node.image && <CategoryImage src={resolveStaticPath(node.image)} />
                    )}
                    <Paragraph typographyStyle="body-md" flex="1">
                        {getNodeTitle(node, language)}
                    </Paragraph>
                </Row>
            </Card>
        );
    }

    return null;
};
