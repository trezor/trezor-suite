import { type ReactNode } from 'react';

import { Box, HStack, Text } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

type TransactionReviewOutputItemRowProps = {
    translationKey: TxKeyPath;
    children: ReactNode;
};

export const TransactionReviewOutputItemRow = ({
    translationKey,
    children,
}: TransactionReviewOutputItemRowProps) => (
    <HStack>
        <Box flex={0.4} justifyContent="center">
            <Text variant="body-sm">
                <Translation id={translationKey} />
            </Text>
        </Box>
        <Box flex={0.6} alignItems="flex-end">
            <Text variant="body-sm" textAlign="right" selectable>
                {children}
            </Text>
        </Box>
    </HStack>
);
