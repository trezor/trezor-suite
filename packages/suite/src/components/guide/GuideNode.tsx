import { type ReactNode } from 'react';

import styled from 'styled-components';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { selectLanguage } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { type GuideNode as GuideNodeType } from '@suite-common/suite-types';
import { IconCircle, type IconName } from '@trezor/components';
import { resolveStaticPath } from '@trezor/env-utils';
import { typography } from '@trezor/theme';

import { openNode } from 'src/actions/suite/guideActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { getNodeTitle } from 'src/utils/suite/guide';

import { GuideItem } from './GuideItem';

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
            <GuideItem onClick={navigateToNode} data-testid={`@guide/node${node.id}`}>
                {label}
            </GuideItem>
        );
    }

    if (node.type === 'category') {
        return (
            <GuideItem
                onClick={navigateToNode}
                data-testid={`@guide/category${node.id}`}
                icon={
                    node.icon ? (
                        <IconCircle name={node.icon as IconName} size={40} intent="neutral" />
                    ) : (
                        node.image && <CategoryImage src={resolveStaticPath(node.image)} />
                    )
                }
            >
                {getNodeTitle(node, language)}
            </GuideItem>
        );
    }
};
