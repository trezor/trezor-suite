import { BoxSkeleton } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

const SKELETON_HEIGHT = 20;
const SKELETON_WIDTH = 100;

export const OverviewValueSkeleton = () => {
    const { translate } = useTranslate();

    return (
        <BoxSkeleton
            height={SKELETON_HEIGHT}
            width={SKELETON_WIDTH}
            accessibilityLabel={translate('moduleTrading.tradingScreen.quotesLoadingLabel')}
        />
    );
};
