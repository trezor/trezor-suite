import { type ReactNode } from 'react';

import { Box, PictogramTitleHeader, ScreenFooterGradient, VStack } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AccountImportScreenHeader } from './AccountImportScreenHeader';

type AccountImportSummaryScreenProps = {
    children: ReactNode;
    title: ReactNode;
    subtitle?: ReactNode;
    footer: ReactNode;
    testID?: string;
};

const screenFooterStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
    backgroundColor: utils.colors.surfaceFillPage,
}));

export const AccountImportSummaryScreen = ({
    children,
    title,
    subtitle,
    footer,
    testID,
}: AccountImportSummaryScreenProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Screen
            header={<AccountImportScreenHeader />}
            footer={
                <>
                    <ScreenFooterGradient />
                    <Box style={applyStyle(screenFooterStyle)}>{footer}</Box>
                </>
            }
            focusedInputBottomOffset={114} // space below the label input + button height with vertical margin
        >
            <VStack spacing="sp32" flex={1}>
                <Box flex={1} alignItems="center" justifyContent="center">
                    <PictogramTitleHeader
                        variant="success"
                        icon="coinVerticalCheck"
                        title={title}
                        subtitle={subtitle}
                    />
                </Box>
                <Box flex={1} testID={testID} accessible>
                    {children}
                </Box>
            </VStack>
        </Screen>
    );
};
