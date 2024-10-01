import { ReactNode } from 'react';

import { VStack, Text } from '@suite-native/atoms';

type AddressReviewSheetSectionProps = {
    title: ReactNode;
    content: ReactNode;
};

export const AddressReviewSheetSection = ({ title, content }: AddressReviewSheetSectionProps) => {
    return (
        <VStack spacing="sp4">
            <Text variant="highlight">{title}</Text>
            <Text color="textSubdued">{content}</Text>
        </VStack>
    );
};
