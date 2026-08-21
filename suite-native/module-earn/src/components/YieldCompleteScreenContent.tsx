import { type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { type Rating, buildUserFeedbackData, sendFeedbackAction } from '@suite-common/feedback';
import { type WrappedNativeFlowType, type YieldFlowType } from '@suite-common/wallet-core';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import {
    Box,
    Button,
    Card,
    HStack,
    Pictogram,
    ScreenFooterGradient,
    Text,
    TitleHeader,
    VStack,
} from '@suite-native/atoms';
import { FeedbackCard } from '@suite-native/feedback-form';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const contentStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.sp48,
}));

const summaryCardStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.surfaceFillSunken,
}));

const summaryRowStyle = prepareNativeStyle<{ hasBorder: boolean; hasContent: boolean }>(
    (utils, { hasBorder, hasContent }) => ({
        paddingHorizontal: utils.spacings.sp16,
        paddingVertical: utils.spacings.sp16,
        borderTopWidth: hasBorder ? utils.borders.widths.small : 0,
        borderTopColor: utils.colors.borderNeutral,
        alignItems: hasContent ? 'stretch' : 'center',
        justifyContent: hasContent ? 'flex-start' : 'space-between',
    }),
);

const footerStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
    backgroundColor: utils.colors.surfaceFillPage,
    marginTop: utils.spacings.sp36,
}));

export type YieldCompleteSummaryRow = {
    key: string;
    label: ReactNode;
} & (
    | {
          value: ReactNode;
          content?: never;
      }
    | {
          value?: never;
          content: ReactNode;
      }
);

type YieldCompleteScreenType = YieldFlowType | WrappedNativeFlowType;

type YieldCompleteScreenContentProps = {
    buttonTranslationId: TxKeyPath;
    onButtonPress: () => void;
    rows: YieldCompleteSummaryRow[];
    subtitle: ReactNode;
    title: ReactNode;
    type: YieldCompleteScreenType;
    vaultId?: string;
};

export const YieldCompleteScreenContent = ({
    buttonTranslationId,
    onButtonPress,
    rows,
    subtitle,
    title,
    type,
    vaultId,
}: YieldCompleteScreenContentProps) => {
    const { applyStyle } = useNativeStyles();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();

    const onFeedbackRatingSelect = (rating: Rating) => {
        analytics.report({
            type: events.feedbackRatingSelectedEvent.name,
            payload: { rating, category: 'yield', context: type },
        });
    };

    const onFeedbackSubmit = (rating: Rating, description: string) => {
        const userData = buildUserFeedbackData(device);

        dispatch(
            sendFeedbackAction({
                type: 'SUGGESTION',
                payload: {
                    category: 'yield',
                    feature: type,
                    description,
                    rating,
                    vaultId,
                    ...userData,
                },
            }),
        );

        analytics.report({
            type: events.feedbackSentEvent.name,
            payload: { category: 'yield', context: type },
        });
    };

    return (
        <Screen
            noBottomPadding
            footer={
                <>
                    <ScreenFooterGradient />
                    <Box style={applyStyle(footerStyle)}>
                        <Button onPress={onButtonPress}>
                            <Translation id={buttonTranslationId} />
                        </Button>
                    </Box>
                </>
            }
        >
            <VStack spacing="sp24" style={applyStyle(contentStyle)}>
                <VStack spacing="sp24" alignItems="center">
                    <Pictogram variant="success" />
                    <TitleHeader
                        title={title}
                        titleVariant="headline-md"
                        titleSpacing="sp4"
                        subtitle={subtitle}
                        subtitleVariant="body-sm"
                        textAlign="center"
                    />
                </VStack>
                <Card
                    noPadding
                    noShadow
                    borderColor="borderNeutral"
                    style={applyStyle(summaryCardStyle)}
                >
                    {rows.map((row, index) => {
                        if ('content' in row) {
                            return (
                                <VStack
                                    key={row.key}
                                    spacing="sp12"
                                    style={applyStyle(summaryRowStyle, {
                                        hasBorder: index > 0,
                                        hasContent: true,
                                    })}
                                >
                                    <Text variant="body-md">{row.label}</Text>
                                    {row.content}
                                </VStack>
                            );
                        }

                        return (
                            <HStack
                                key={row.key}
                                spacing="sp16"
                                style={applyStyle(summaryRowStyle, {
                                    hasBorder: index > 0,
                                    hasContent: false,
                                })}
                            >
                                <Text variant="body-md">{row.label}</Text>
                                <Box flexShrink={1} alignItems="flex-end">
                                    {row.value}
                                </Box>
                            </HStack>
                        );
                    })}
                </Card>

                <FeedbackCard
                    heading={<Translation id="feedbackForm.title" />}
                    description={<Translation id="feedbackForm.description" />}
                    submitLabel={<Translation id="feedbackForm.submitButton" />}
                    successHeading={<Translation id="feedbackForm.successTitle" />}
                    successDescription={<Translation id="feedbackForm.successDescription" />}
                    closeLabel={<Translation id="generic.buttons.close" />}
                    onSubmit={onFeedbackSubmit}
                    onRatingSelect={onFeedbackRatingSelect}
                />
            </VStack>
        </Screen>
    );
};
