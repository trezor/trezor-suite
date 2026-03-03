import { useState } from 'react';

import {
    BuyTradeStatus,
    ExchangeProviderInfo,
    ExchangeTradeStatus,
    SellTradeStatus,
} from 'invity-api';

import { Translation } from '@suite/intl';
import { Rating, buildUserFeedbackData, sendFeedbackAction } from '@suite-common/feedback';
import { selectCountryCode } from '@suite-common/geolocation';
import {
    formatExperimentVariantsForAnalytics,
    selectActiveExperimentsWithVariants,
} from '@suite-common/message-system';
import { TradingType } from '@suite-common/trading';
import { Button, Card, Column, H3, IconCircle, Paragraph, Row, Textarea } from '@trezor/components';

import { EmojiRatingSelector } from 'src/components/suite/EmojiRatingSelector';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';

interface TradingDetailFeedbackProps {
    status: ExchangeTradeStatus | SellTradeStatus | BuyTradeStatus | undefined;
    type: TradingType;
    provider?: ExchangeProviderInfo['name'];
    id?: string;
    quoteAmounts: TradingGetCryptoQuoteAmountProps;
    country?: string;
}

export const TradingDetailFeedback = ({
    status,
    type,
    provider,
    id,
    quoteAmounts: { sendCurrency, receiveCurrency },
    country,
}: TradingDetailFeedbackProps) => {
    const [rating, setRating] = useState<Rating | undefined>();
    const [description, setDescription] = useState<string>('');
    const [view, setView] = useState<'form' | 'success'>('form');

    const { device } = useDevice();
    const dispatch = useDispatch();
    const geolocation = useSelector(selectCountryCode);

    const activeExperimentsWithVariants = useSelector(selectActiveExperimentsWithVariants);

    const submitFeedback = () => {
        if (!rating) return;

        const userData = buildUserFeedbackData(device);

        dispatch(
            sendFeedbackAction({
                type: 'SUGGESTION',
                payload: {
                    category: 'trade',
                    description,
                    rating,
                    status,
                    provider,
                    id,
                    type,
                    sendCurrency,
                    receiveCurrency,
                    geolocation: geolocation || undefined,
                    countryOfResidence: country || undefined,
                    activeExperimentsWithVariants: formatExperimentVariantsForAnalytics(
                        activeExperimentsWithVariants,
                    ),
                    ...userData,
                },
            }),
        );

        setView('success');
        setRating(undefined);
        setDescription('');
    };

    const isFormValid = rating !== undefined && description.trim().length > 0;

    const Success = (
        <Row gap={20} margin={{ vertical: 8 }}>
            <IconCircle name="check" size={40} />
            <Column gap={8}>
                <H3>
                    <Translation id="TR_EXCHANGE_DETAIL_FEEDBACK_SUCCESS_TITLE" />
                </H3>
                <Paragraph typographyStyle="body-sm">
                    <Translation id="TR_EXCHANGE_DETAIL_FEEDBACK_SUCCESS_DESCRIPTION" />
                </Paragraph>
            </Column>
        </Row>
    );

    const Form = (
        <>
            <H3>
                <Translation id="TR_EXCHANGE_DETAIL_FEEDBACK_TITLE" />
            </H3>

            <EmojiRatingSelector value={rating} onChange={setRating} />

            <Paragraph typographyStyle="body-sm">
                <Translation id="TR_EXCHANGE_DETAIL_FEEDBACK_DESCRIPTION" />
            </Paragraph>

            <Textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                characterCount
                data-testid="@trading/feedback/textarea"
                maxLength={1000}
            />

            <Button isDisabled={!isFormValid} intent="brand" type="button" onClick={submitFeedback}>
                <Translation id="TR_EXCHANGE_DETAIL_FEEDBACK_INPUT_BUTTON" />
            </Button>
        </>
    );

    return (
        <Card>
            <Column gap={16} alignItems="start" margin={{ vertical: 8 }}>
                {view === 'form' ? Form : Success}
            </Column>
        </Card>
    );
};
