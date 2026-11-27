import { type ReactNode } from 'react';

import { Card } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AssetsGetSvg } from '../../../../assets/AssetsGetSvg';

const ILLUSTRATION_SIZE = 120;

const containerStyle = prepareNativeStyle(({ spacings }) => ({
    marginHorizontal: spacings.sp16,
    padding: spacings.sp24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacings.sp20,
}));

type PortfolioAssetsEmptyStateContainerProps = {
    children: ReactNode;
    testID?: string;
};

export const PortfolioAssetsEmptyStateContainer = ({
    children,
    testID,
}: PortfolioAssetsEmptyStateContainerProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card style={applyStyle(containerStyle)} testID={testID}>
            <AssetsGetSvg width={ILLUSTRATION_SIZE} height={ILLUSTRATION_SIZE} />
            {children}
        </Card>
    );
};
