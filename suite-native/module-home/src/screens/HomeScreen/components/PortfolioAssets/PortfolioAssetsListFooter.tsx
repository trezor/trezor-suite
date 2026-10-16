import { Divider, VStack } from '@suite-native/atoms';

import { PortfolioAssetsShowMoreButton } from './PortfolioAssetsShowMoreButton';

type PortfolioAssetsListFooterProps = {
    isExpanded: boolean;
    onShowMorePress: () => void;
};

export const PortfolioAssetsListFooter = ({
    isExpanded,
    onShowMorePress,
}: PortfolioAssetsListFooterProps) => (
    <>
        <Divider />
        <VStack alignItems="center" paddingVertical="sp12">
            <PortfolioAssetsShowMoreButton isExpanded={isExpanded} onPress={onShowMorePress} />
        </VStack>
    </>
);
