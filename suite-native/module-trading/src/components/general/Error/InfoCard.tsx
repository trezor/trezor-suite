import { ReactNode } from 'react';

import { Card, PictogramTitleHeader, Text, VStack } from '@suite-native/atoms';

export type InfoCardProps = {
    title: ReactNode;
    description: ReactNode;
};

export const InfoCard = ({ title, description }: InfoCardProps) => (
    <Card>
        <VStack spacing="sp24" paddingVertical="sp8">
            <PictogramTitleHeader
                variant="info"
                title={title}
                titleVariant="highlight"
                subtitle={
                    <Text variant="hint" color="textSubdued" textAlign="center">
                        {description}
                    </Text>
                }
            />
        </VStack>
    </Card>
);
