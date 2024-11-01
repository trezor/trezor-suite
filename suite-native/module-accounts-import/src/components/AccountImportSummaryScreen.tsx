import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import { Box, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';

import { AccountImportSubHeader } from './AccountImportSubHeader';

type AccountImportSummaryScreenProps = {
    children: ReactNode;
    title: ReactNode;
    subtitle?: ReactNode;
    footer: ReactNode;
    testID?: string;
};

export const AccountImportSummaryScreen = ({
    children,
    title,
    subtitle,
    footer,
    testID,
}: AccountImportSummaryScreenProps) => {
    return (
        <Screen
            customHorizontalPadding="sp16"
            screenHeader={<AccountImportSubHeader />}
            footer={
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <Box margin="sp16">{footer}</Box>
                </KeyboardAvoidingView>
            }
        >
            <VStack spacing="sp32" flex={1}>
                <Box flex={1} alignItems="center" justifyContent="center">
                    <PictogramTitleHeader
                        title={title}
                        subtitle={subtitle}
                        variant="green"
                        icon="coinVerticalCheck"
                    />
                </Box>
                <Box flex={1} justifyContent="flex-end" testID={testID}>
                    {children}
                </Box>
            </VStack>
        </Screen>
    );
};
