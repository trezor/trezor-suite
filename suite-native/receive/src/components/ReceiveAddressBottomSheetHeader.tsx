import React, { type ReactNode } from 'react';

import { Text, VStack } from '@suite-native/atoms';

type ReceiveAddressBottomSheetHeaderProps = {
    title: ReactNode;
    description: ReactNode;
};

export const ReceiveAddressBottomSheetHeader = ({
    title,
    description,
}: ReceiveAddressBottomSheetHeaderProps) => (
    <VStack alignItems="center">
        <Text textAlign="center" variant="headline-sm">
            {title}
        </Text>
        <Text textAlign="center" color="textSubdued">
            {description}
        </Text>
    </VStack>
);
