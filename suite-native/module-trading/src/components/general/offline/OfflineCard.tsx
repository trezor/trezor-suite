import { ReactNode } from 'react';

import { Card, PictogramTitleHeader, Text, VStack } from '@suite-native/atoms';

export type OfflineCardProps = {
    title: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
};

export const OfflineCard = ({ title, description, children }: OfflineCardProps) => (
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
