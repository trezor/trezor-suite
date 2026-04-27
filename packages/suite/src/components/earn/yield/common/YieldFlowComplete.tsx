import { Translation, useTranslation } from '@suite/intl';
import { goto } from '@suite/router';
import { type Rating, buildUserFeedbackData, sendFeedbackAction } from '@suite-common/feedback';
import type { YieldFlowCompleteValue } from '@suite-common/wallet-core';
import { Button, Card, Column, Icon, IconCircle, Row, Text } from '@trezor/components';
import { FeedbackCard } from '@trezor/product-components';

import { useDispatch } from 'src/hooks/suite';
import { ApyValue } from 'src/views/wallet/staking/components/ApyValue';

import { YieldTokenValue } from './YieldTokenValue';

const flowTypeContentMap = {
    supply: {
        heading: 'TR_EARN_YIELD_SUPPLY_COMPLETE',
        description: 'TR_EARN_YIELD_SUPPLY_COMPLETE_DESCRIPTION',
        input: 'TR_EARN_YIELD_SUPPLIED',
        output: 'TR_RECEIVED',
    },
    withdraw: {
        heading: 'TR_EARN_YIELD_WITHDRAW_COMPLETE',
        description: 'TR_EARN_YIELD_WITHDRAW_COMPLETE_DESCRIPTION',
        input: 'TR_SENT',
        output: 'TR_RECEIVED',
    },
} as const;

type YieldFlowCompleteProps = {
    flowType: keyof typeof flowTypeContentMap;
    input: YieldFlowCompleteValue;
    output: YieldFlowCompleteValue;
    apy?: number | null;
};

export const YieldFlowComplete = ({ flowType, input, output, apy }: YieldFlowCompleteProps) => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const flowContent = flowTypeContentMap[flowType];

    const handleBackToOverview = () => {
        dispatch(goto({ routeName: 'suite-earn' }));
    };

    const handleFeedbackSubmit = (rating: Rating, description: string) => {
        dispatch(
            sendFeedbackAction({
                type: 'SUGGESTION',
                payload: {
                    category: 'experimental',
                    feature: 'stablecoin-yield',
                    rating,
                    description,
                    ...buildUserFeedbackData(),
                },
            }),
        );
    };

    return (
        <Column gap={16}>
            <IconCircle name="check" intent="brand" size={96} />

            <Column gap={4}>
                <Text typographyStyle="headline-md">
                    <Translation id={flowContent.heading} />
                </Text>

                <Text intent="neutral" priority="secondary">
                    <Translation
                        id={flowContent.description}
                        values={{ displaySymbol: output.token.symbol }}
                    />
                </Text>
            </Column>

            <Card fillType="flat" paddingType="none">
                <Column gap={0} hasDivider>
                    <Row
                        justifyContent="space-between"
                        alignItems="center"
                        padding={{ vertical: 16, horizontal: 20 }}
                    >
                        <Text typographyStyle="body-md">
                            <Translation id="TR_EARN_YIELD_STATUS" />
                        </Text>
                        <Row alignItems="center" gap={8}>
                            <Icon name="checkCircleFilled" intent="brand" />
                            <Text typographyStyle="body-md" intent="brand">
                                <Translation id="TR_EARN_YIELD_COMPLETED" />
                            </Text>
                        </Row>
                    </Row>
                    {flowType === 'supply' && (
                        <Row
                            justifyContent="space-between"
                            alignItems="center"
                            padding={{ vertical: 16, horizontal: 20 }}
                        >
                            <Text typographyStyle="body-md">
                                <Translation id="TR_EARN_DASHBOARD_TABLE_APY" />
                            </Text>
                            <Text typographyStyle="body-md-strong">
                                <ApyValue apy={apy} />
                            </Text>
                        </Row>
                    )}
                    <Row
                        justifyContent="space-between"
                        alignItems="center"
                        padding={{ vertical: 16, horizontal: 20 }}
                    >
                        <Column gap={8}>
                            <Text typographyStyle="body-md">
                                <Translation id={flowContent.input} />
                            </Text>
                            <YieldTokenValue
                                token={{
                                    ...input.token,
                                    contractAddress: input.token.contractAddress ?? null,
                                }}
                                amount={input.amount}
                            />
                        </Column>
                        <Icon name="arrowRight" size={20} intent="neutral" priority="secondary" />
                        <Column gap={8} alignItems="flex-end">
                            <Text typographyStyle="body-md">
                                <Translation id={flowContent.output} />
                            </Text>
                            <YieldTokenValue
                                token={{
                                    ...output.token,
                                    contractAddress: output.token.contractAddress ?? null,
                                }}
                                amount={output.amount}
                            />
                        </Column>
                    </Row>
                </Column>
            </Card>

            <Button intent="neutral" priority="secondary" onClick={handleBackToOverview}>
                <Translation id="TR_EARN_YIELD_BACK_TO_OVERVIEW" />
            </Button>

            <FeedbackCard
                heading={
                    <Translation
                        id="TR_FEATURE_FEEDBACK_CARD_HEADING"
                        values={{
                            feature: translationString('TR_EARN_STABLECOIN_YIELD_TITLE'),
                        }}
                    />
                }
                description={<Translation id="TR_FEEDBACK_CARD_DESCRIPTION" />}
                submitLabel={<Translation id="TR_FEEDBACK_CARD_SEND" />}
                successHeading={<Translation id="TR_FEEDBACK_CARD_SUCCESS_TITLE" />}
                successDescription={<Translation id="TR_FEEDBACK_CARD_SUCCESS_DESCRIPTION" />}
                onSubmit={handleFeedbackSubmit}
            />
        </Column>
    );
};
