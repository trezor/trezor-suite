import { selectIsDeviceCompromised } from '@suite/authenticity-checks';
import { Translation, type TranslationId } from '@suite/intl';
import {
    Card,
    Column,
    H3,
    IconCircle,
    type IconComponent,
    List,
    Paragraph,
} from '@trezor/components';
import { ArrowFatLinesRightIcon, MoneyIcon, UserIcon } from '@trezor/icons';

import { useSelector } from 'src/hooks/suite';
import { useMessageSystemTrading } from 'src/hooks/suite/useMessageSystemTrading';

import { TradingFooter } from '../common';
import { TradingConciergeForm } from './TradingConciergeForm';
import { TradingDisabled } from '../common/TradingDisabled';
import { TradingLayout } from '../common/TradingLayout/TradingLayout';

const LIST_ITEMS: { titleId: TranslationId; descriptionId: TranslationId; icon: IconComponent }[] =
    [
        {
            titleId: 'TR_TRADING_CONCIERGE_BENEFIT_PRICING_TITLE',
            descriptionId: 'TR_TRADING_CONCIERGE_BENEFIT_PRICING_DESCRIPTION',
            icon: MoneyIcon,
        },
        {
            titleId: 'TR_TRADING_CONCIERGE_BENEFIT_SPECIALIST_TITLE',
            descriptionId: 'TR_TRADING_CONCIERGE_BENEFIT_SPECIALIST_DESCRIPTION',
            icon: UserIcon,
        },
        {
            titleId: 'TR_TRADING_CONCIERGE_BENEFIT_EXECUTION_TITLE',
            descriptionId: 'TR_TRADING_CONCIERGE_BENEFIT_EXECUTION_DESCRIPTION',
            icon: ArrowFatLinesRightIcon,
        },
    ];

export const TradingConciergeDetail = () => {
    const { isDisabled, content } = useMessageSystemTrading('concierge');
    const isDeviceCompromised = useSelector(selectIsDeviceCompromised);

    return (
        <TradingLayout>
            {isDisabled || isDeviceCompromised ? (
                <TradingDisabled type="concierge" content={content} />
            ) : (
                <>
                    <Column
                        width="100%"
                        alignItems="center"
                        gap={24}
                        maxWidth="440px"
                        alignSelf="center"
                    >
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
                                        bulletComponent={<IconCircle icon={item.icon} size={24} />}
                                    >
                                        <Paragraph typographyStyle="body-md-strong">
                                            <Translation id={item.titleId} />
                                        </Paragraph>
                                        <Paragraph
                                            typographyStyle="body-sm"
                                            color="contentSecondary"
                                        >
                                            <Translation id={item.descriptionId} />
                                        </Paragraph>
                                    </List.Item>
                                ))}
                            </List>
                        </Card>

                        <TradingConciergeForm />
                    </Column>
                    <TradingFooter />
                </>
            )}
        </TradingLayout>
    );
};
