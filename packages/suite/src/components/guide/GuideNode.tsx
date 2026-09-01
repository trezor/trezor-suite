import { type ReactNode } from 'react';
import { useDispatch } from 'react-redux';

import styled from 'styled-components';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { selectLanguage } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { type GuideNode as GuideNodeType } from '@suite-common/suite-types';
import { CardList, Column, Icon, IconCircle, Row, Text } from '@trezor/components';
import { type IconComponent } from '@trezor/components';
import { resolveStaticPath } from '@trezor/env-utils';
import {
    ArrowsLeftRightFilledIcon,
    CaretRightIcon,
    CheckCircleIcon,
    CoinsIcon,
    CurrencyBtcIcon,
    GearIcon,
    PiggyBankIcon,
} from '@trezor/icons';

import { openNode } from 'src/actions/suite/guideActions';
import { useSelector } from 'src/hooks/suite';
import { getNodeTitle } from 'src/utils/suite/guide';

import { GuideItem } from './GuideItem';

const CategoryImage = styled.img`
    width: 32px;
    height: 32px;
    object-fit: contain;
`;

const guideCategoryIcons: Partial<Record<string, IconComponent>> = {
    arrowsLeftRightFilled: ArrowsLeftRightFilledIcon,
    checkCircle: CheckCircleIcon,
    coins: CoinsIcon,
    currencyBtc: CurrencyBtcIcon,
    gear: GearIcon,
    piggyBank: PiggyBankIcon,
};

type GuideNodeProps = {
    node: GuideNodeType;
    description?: ReactNode;
    itemVariant?: 'default' | 'cardList';
};

export const GuideNode = ({ node, description, itemVariant = 'cardList' }: GuideNodeProps) => {
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

    if (node.type === 'page') {
        return (
            <CardList.Item
                paddingType="medium"
                onClick={navigateToNode}
                data-testid={`@guide/node${node.id}`}
            >
                <Column
                    flex="1"
                    gap={description ? 4 : 0}
                    overflow="hidden"
                    alignItems="flex-start"
                >
                    <Text
                        typographyStyle={description ? 'body-sm-strong' : 'body-md'}
                        as="div"
                        maxWidth="100%"
                    >
                        {getNodeTitle(node, language)}
                    </Text>
                    {description && (
                        <Text
                            typographyStyle="body-sm"
                            intent="neutral"
                            priority="secondary"
                            as="div"
                            maxWidth="100%"
                        >
                            {description}
                        </Text>
                    )}
                </Column>
                <Icon as={CaretRightIcon} size={20} intent="neutral" priority="secondary" />
            </CardList.Item>
        );
    }

    if (node.type === 'category') {
        const icon = node.icon ? guideCategoryIcons[node.icon] : undefined;
        const categoryIcon = icon ? (
            <IconCircle icon={icon} size={32} intent="neutral" />
        ) : (
            node.image && <CategoryImage src={resolveStaticPath(node.image)} />
        );

        if (itemVariant === 'default') {
            return (
                <GuideItem
                    onClick={navigateToNode}
                    data-testid={`@guide/category${node.id}`}
                    icon={categoryIcon}
                >
                    {getNodeTitle(node, language)}
                </GuideItem>
            );
        }

        return (
            <CardList.Item
                paddingType="medium"
                onClick={navigateToNode}
                data-testid={`@guide/category${node.id}`}
            >
                <Row gap={12} alignItems="center" flex="1" overflow="hidden">
                    {categoryIcon}
                    <Text typographyStyle="body-md" as="div" maxWidth="100%">
                        {getNodeTitle(node, language)}
                    </Text>
                </Row>
                <Icon as={CaretRightIcon} size={20} intent="neutral" priority="secondary" />
            </CardList.Item>
        );
    }
};
