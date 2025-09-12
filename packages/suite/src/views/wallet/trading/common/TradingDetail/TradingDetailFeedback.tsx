import { useState } from 'react';

import {
    BuyTradeStatus,
    ExchangeProviderInfo,
    ExchangeTradeStatus,
    SellTradeStatus,
} from 'invity-api';

import { Rating, buildUserFeedbackData, sendFeedbackAction } from '@suite-common/feedback';
import { ExperimentId } from '@suite-common/message-system';
import { TradingType } from '@suite-common/trading';
import { Button, Card, Column, IconCircle, Row, Text, Textarea } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { EmojiRatingSelector } from 'src/components/suite/EmojiRatingSelector';
import { ExperimentWrapper } from 'src/components/suite/Experiment/ExperimentWrapper';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';

interface TradingDetailFeedbackProps {
    status: ExchangeTradeStatus | SellTradeStatus | BuyTradeStatus | undefined;
    type: TradingType;
    provider?: ExchangeProviderInfo['name'];
    id?: string;
    quoteAmounts: TradingGetCryptoQuoteAmountProps;
}

export const TradingDetailFeedback = ({
    status,
    type,
    provider,
    id,
    quoteAmounts: { sendCurrency, receiveCurrency },
}: TradingDetailFeedbackProps) => {
    const [rating, setRating] = useState<Rating | undefined>();
    const [description, setDescription] = useState<string>('');
    const [view, setView] = useState<'form' | 'success'>('form');

    const { device } = useDevice();
    const dispatch = useDispatch();

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
        <Row gap={spacings.lg} margin={{ vertical: spacings.xs }}>
            <IconCircle name="check" size={64} />
            <Column gap={spacings.xs}>
                <Text typographyStyle="titleSmall">
                    <Translation id="TR_EXCHANGE_DETAIL_FEEDBACK_SUCCESS_TITLE" />
                </Text>
                <Text typographyStyle="hint">
                    <Translation id="TR_EXCHANGE_DETAIL_FEEDBACK_SUCCESS_DESCRIPTION" />
                </Text>
            </Column>
        </Row>
    );

    const Form = (
        <>
            <Text typographyStyle="titleSmall">
                <Translation id="TR_EXCHANGE_DETAIL_FEEDBACK_TITLE" />
            </Text>

            <EmojiRatingSelector value={rating} onChange={setRating} />

            <Text typographyStyle="hint">
                <Translation id="TR_EXCHANGE_DETAIL_FEEDBACK_DESCRIPTION" />
            </Text>

            <Textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                characterCount
                data-testid="@trading/feedback/textarea"
                maxLength={1000}
            />

            <Button
                isDisabled={!isFormValid}
                variant="primary"
                type="button"
                size="small"
                onClick={submitFeedback}
            >
                <Translation id="TR_EXCHANGE_DETAIL_FEEDBACK_INPUT_BUTTON" />
            </Button>
        </>
    );

    return (
        <ExperimentWrapper
            id={ExperimentId.tradingFeedbackForm}
            components={[
                { variant: 'A', element: <></> },
                {
                    variant: 'B',
                    element: (
                        <Card>
                            <Column
                                gap={spacings.md}
                                alignItems="start"
                                margin={{ vertical: spacings.xs }}
                            >
                                {view === 'form' ? Form : Success}
                            </Column>
                        </Card>
                    ),
                },
            ]}
        />
    );
};
