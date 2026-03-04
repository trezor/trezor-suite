import { Translation, TranslationId } from '@suite/intl';
import { Card, Column, H3, IconCircle, IconName, List, Paragraph } from '@trezor/components';

import { TradingFooter } from '../common';
import { TradingConciergeForm } from './TradingConciergeForm';
import { TradingLayout } from '../common/TradingLayout/TradingLayout';

const LIST_ITEMS: { titleId: TranslationId; descriptionId: TranslationId; icon: IconName }[] = [
    {
        titleId: 'TR_TRADING_CONCIERGE_BENEFIT_PRICING_TITLE',
        descriptionId: 'TR_TRADING_CONCIERGE_BENEFIT_PRICING_DESCRIPTION',
        icon: 'money',
    },
    {
        titleId: 'TR_TRADING_CONCIERGE_BENEFIT_SPECIALIST_TITLE',
        descriptionId: 'TR_TRADING_CONCIERGE_BENEFIT_SPECIALIST_DESCRIPTION',
        icon: 'user',
    },
    {
        titleId: 'TR_TRADING_CONCIERGE_BENEFIT_EXECUTION_TITLE',
        descriptionId: 'TR_TRADING_CONCIERGE_BENEFIT_EXECUTION_DESCRIPTION',
        icon: 'arrowFatLinesRight',
    },
];

export const TradingConciergeDetail = () => (
    <TradingLayout>
        <Column width="100%" alignItems="center" gap={24} maxWidth="440px" alignSelf="center">
            <Card width="100%" paddingType="large">
                <H3 typographyStyle="headline-sm">
                    <Translation id="TR_TRADING_CONCIERGE_TITLE" />
                </H3>

                <Paragraph margin={{ bottom: 20 }} typographyStyle="body-sm">
                    <Translation id="TR_TRADING_CONCIERGE_DESCRIPTION" />
                </Paragraph>

                <List gap={20} bulletAlignment="start">
                    {LIST_ITEMS.map(item => (
                        <List.Item
                            key={item.titleId}
                            bulletComponent={<IconCircle name={item.icon} size={24} />}
                        >
                            <Paragraph typographyStyle="body-md-strong">
                                <Translation id={item.titleId} />
                            </Paragraph>
                            <Paragraph typographyStyle="body-sm" color="textSubdued">
                                <Translation id={item.descriptionId} />
                            </Paragraph>
                        </List.Item>
                    ))}
                </List>
            </Card>

            <TradingConciergeForm />
        </Column>
        <TradingFooter />
    </TradingLayout>
);
