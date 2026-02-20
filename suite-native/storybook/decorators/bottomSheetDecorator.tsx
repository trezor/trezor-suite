import React from 'react';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export const bottomSheetDecorator = (Story: React.FC) => (
    <BottomSheetModalProvider>
        <Story />
    </BottomSheetModalProvider>
);
