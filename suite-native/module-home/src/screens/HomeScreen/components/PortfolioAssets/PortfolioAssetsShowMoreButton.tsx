import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type PortfolioAssetsShowMoreButtonProps = {
    isExpanded: boolean;
    onPress: () => void;
};

export const PortfolioAssetsShowMoreButton = ({
    isExpanded,
    onPress,
}: PortfolioAssetsShowMoreButtonProps) => (
    <Button
        size="small"
        intent="neutral"
        priority="secondary"
        onPress={onPress}
        testID="@home/portfolio-assets/show-more"
    >
        <Translation
            id={isExpanded ? 'moduleHome.assets.showLess' : 'moduleHome.assets.showMore'}
        />
    </Button>
);
