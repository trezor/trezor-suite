import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { Button, Card, Column, Icon, IconCircle, Row, Text } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';

import { YieldTokenValue } from './YieldTokenValue';
import type { YieldFlowCompleteValue } from './types';

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
};

export const YieldFlowComplete = ({ flowType, input, output }: YieldFlowCompleteProps) => {
    const dispatch = useDispatch();
    const flowContent = flowTypeContentMap[flowType];

    const handleBackToOverview = () => {
        dispatch(goto({ routeName: 'suite-earn' }));
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
                            {/* TODO: Replace placeholder APY after simulated transaction output */}
                            <Text typographyStyle="body-md-strong">3,21%</Text>
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
                                value={input.value}
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
                                value={output.value}
                            />
                        </Column>
                    </Row>
                </Column>
            </Card>

            <Button intent="neutral" priority="secondary" onClick={handleBackToOverview}>
                <Translation id="TR_EARN_YIELD_BACK_TO_OVERVIEW" />
            </Button>
        </Column>
    );
};
