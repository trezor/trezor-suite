import { type ReactNode } from 'react';

import { Text, VStack } from '@suite-native/atoms';

type AddressReviewSheetSectionProps = {
    title: ReactNode;
    content: ReactNode;
};

export const AddressReviewSheetSection = ({ title, content }: AddressReviewSheetSectionProps) => (
    <VStack spacing="sp4">
        <Text variant="body-md-strong">{title}</Text>
        <Text color="contentSecondary">{content}</Text>
    </VStack>
);
