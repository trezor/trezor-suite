import { type ReactNode } from 'react';

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
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

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

type YieldCompleteScreenContentProps = {
    buttonTranslationId: TxKeyPath;
    onButtonPress: () => void;
    rows: YieldCompleteSummaryRow[];
    subtitle: ReactNode;
    title: ReactNode;
};

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
}));

export const YieldCompleteScreenContent = ({
    buttonTranslationId,
    onButtonPress,
    rows,
    subtitle,
    title,
}: YieldCompleteScreenContentProps) => {
    const { applyStyle } = useNativeStyles();

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
            </VStack>
        </Screen>
    );
};
