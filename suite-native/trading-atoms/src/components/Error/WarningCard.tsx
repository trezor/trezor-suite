import { ReactNode } from 'react';

import { Card, PictogramTitleHeader, Text, VStack } from '@suite-native/atoms';

export type WarningCardProps = {
    title: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
};

export const WarningCard = ({ title, description, children }: WarningCardProps) => (
    <Card>
        <VStack spacing="sp24" paddingVertical="sp8">
            <PictogramTitleHeader
                variant="warning"
                title={title}
                titleVariant="highlight"
                subtitle={
                    !!description && (
                        <Text variant="hint" color="textSubdued" textAlign="center">
                            {description}
                        </Text>
                    )
                }
            />
            {children}
        </VStack>
    </Card>
);
