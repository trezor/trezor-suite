import React, { ReactNode } from 'react';

import { VStack, Text } from '@suite-native/atoms';

type ReceiveAddressBottomSheetHeaderProps = {
    title: ReactNode;
    description: ReactNode;
};

export const ReceiveAddressBottomSheetHeader = ({
    title,
    description,
}: ReceiveAddressBottomSheetHeaderProps) => (
    <VStack alignItems="center">
        <Text textAlign="center" variant="titleSmall">
            {title}
        </Text>
        <Text textAlign="center" color="textSubdued">
            {description}
        </Text>
    </VStack>
);
