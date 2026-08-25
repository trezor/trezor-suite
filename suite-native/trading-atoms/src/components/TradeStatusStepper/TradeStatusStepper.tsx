import { type ReactElement, type ReactNode } from 'react';

import { Box, Spinner, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { exhaustive } from '@trezor/type-utils';

export type TradeStatusStepState = 'active' | 'completed' | 'pending';

export type TradeStatusStepContent<T> = {
    pending: T;
    processing?: T;
    completed?: T;
};

export type TradeStatusStepLayoutTitle = {
    kind: 'layout';
    content: ReactElement;
};

export type TradeStatusStepTitle = ReactNode | TradeStatusStepLayoutTitle;

export type TradeStatusStep = {
    id: string;
    state: TradeStatusStepState;
    title: TradeStatusStepContent<TradeStatusStepTitle>;
    subItems?: TradeStatusStepContent<readonly ReactElement[]>;
};

export type TradeStatusStepperProps = {
    steps: readonly TradeStatusStep[];
    testID?: string;
};

type TradeStatusStepIndicatorProps = {
    id: string;
    state: TradeStatusStepState;
};

const INDICATOR_SIZE = 24;

const stepStyle = prepareNativeStyle(() => ({
    flexDirection: 'row',
    gap: 12,
}));

const indicatorColumnStyle = prepareNativeStyle(() => ({
    width: INDICATOR_SIZE,
    alignItems: 'center',
}));

const pendingIndicatorStyle = prepareNativeStyle(utils => ({
    width: 8,
    height: 8,
    margin: 8,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.elementFillNeutralBold,
}));

const connectorStyle = prepareNativeStyle<{ isCompleted: boolean }>((utils, { isCompleted }) => ({
    flex: 1,
    width: 2,
    minHeight: 16,
    marginVertical: 4,
    backgroundColor: isCompleted
        ? utils.colors.elementFillBrandSoft
        : utils.colors.elementFillNeutralSofter,
}));

const stepContentStyle = prepareNativeStyle<{ isLast: boolean }>((_, { isLast }) => ({
    flex: 1,
    paddingBottom: isLast ? 0 : 24,
}));

const titleStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
}));

const TradeStatusStepIndicator = ({ id, state }: TradeStatusStepIndicatorProps) => {
    const { applyStyle } = useNativeStyles();
    const testID = `@trade-status-stepper/${id}/${state}`;

    switch (state) {
        case 'active':
            return (
                <Box testID={testID}>
                    <Spinner loadingState="idle" size={INDICATOR_SIZE} />
                </Box>
            );

        case 'completed':
            return (
                <Box testID={testID}>
                    <Icon name="checkCircleFilled" color="contentBrand" />
                </Box>
            );
        case 'pending':
            return <Box style={applyStyle(pendingIndicatorStyle)} testID={testID} />;
        default:
            return exhaustive(state);
    }
};

const getTradeStatusStepContent = <T,>(
    content: TradeStatusStepContent<T>,
    state: TradeStatusStepState,
): T => {
    switch (state) {
        case 'active':
            return content.processing ?? content.pending;
        case 'completed':
            return content.completed ?? content.processing ?? content.pending;
        case 'pending':
            return content.pending;
        default:
            return exhaustive(state);
    }
};

const isTradeStatusStepLayoutTitle = (
    title: TradeStatusStepTitle,
): title is TradeStatusStepLayoutTitle =>
    typeof title === 'object' && title !== null && 'kind' in title && title.kind === 'layout';

export const TradeStatusStepper = ({ steps, testID }: TradeStatusStepperProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack spacing={0} testID={testID}>
            {steps.map((step, index) => {
                const { state, id, subItems } = step;
                const isLast = index === steps.length - 1;
                const isCompleted = state === 'completed';
                const isProcessing = state === 'active';
                const title = getTradeStatusStepContent(step.title, state);
                const stepSubItems = subItems
                    ? getTradeStatusStepContent(subItems, state)
                    : undefined;

                return (
                    <Box key={id} style={applyStyle(stepStyle)}>
                        <Box style={applyStyle(indicatorColumnStyle)}>
                            <TradeStatusStepIndicator id={id} state={state} />
                            {!isLast && (
                                <Box
                                    style={applyStyle(connectorStyle, { isCompleted })}
                                    testID={`@trade-status-stepper/${id}/connector`}
                                />
                            )}
                        </Box>
                        <VStack spacing="sp4" style={applyStyle(stepContentStyle, { isLast })}>
                            {isTradeStatusStepLayoutTitle(title) ? (
                                <Box style={applyStyle(titleStyle)}>{title.content}</Box>
                            ) : (
                                <Text
                                    variant={isProcessing ? 'body-md-strong' : 'body-md'}
                                    color={isCompleted ? 'contentSecondary' : 'contentPrimary'}
                                    style={applyStyle(titleStyle)}
                                >
                                    {title}
                                </Text>
                            )}
                            <VStack spacing="sp12">
                                {stepSubItems?.map(subItem => (
                                    <Box key={subItem.key}>{subItem}</Box>
                                ))}
                            </VStack>
                        </VStack>
                    </Box>
                );
            })}
        </VStack>
    );
};
