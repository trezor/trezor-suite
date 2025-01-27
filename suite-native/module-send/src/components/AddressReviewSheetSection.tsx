import { ReactNode } from 'react';

import { Text, VStack } from '@suite-native/atoms';

type AddressReviewSheetSectionProps = {
    title: ReactNode;
    content: ReactNode;
};

export const AddressReviewSheetSection = ({ title, content }: AddressReviewSheetSectionProps) => (
    <VStack spacing="sp4">
        <Text variant="highlight">{title}</Text>
        <Text color="textSubdued">{content}</Text>
    </VStack>
);
