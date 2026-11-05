import { useSelector } from 'react-redux';

import { selectHiddenWalletAssetCount, selectSmallBalanceSummary } from '@suite-common/assets';
import { Divider } from '@suite-native/atoms';

import { PortfolioAssetsHiddenTokensOption } from './PortfolioAssetsHiddenTokensOption';
import { PortfolioAssetsSmallBalancesSwitch } from './PortfolioAssetsSmallBalancesSwitch';
import { PortfolioAssetsViewOptionsSectionLabel } from './PortfolioAssetsViewOptionsSectionLabel';

type PortfolioAssetsTokensOptionsProps = {
    onSmallBalancesChange: (areShown: boolean) => void;
    onHiddenTokensPress: () => void;
};

export const PortfolioAssetsTokensOptions = ({
    onSmallBalancesChange,
    onHiddenTokensPress,
}: PortfolioAssetsTokensOptionsProps) => {
    const smallBalances = useSelector(selectSmallBalanceSummary);
    const hiddenTokenCount = useSelector(selectHiddenWalletAssetCount);

    const hasHiddenTokens = hiddenTokenCount > 0;

    if (smallBalances === undefined && !hasHiddenTokens) {
        return null;
    }

    return (
        <>
            <Divider marginVertical="sp6" />
            <PortfolioAssetsViewOptionsSectionLabel labelId="moduleHome.assets.viewOptionsSheet.tokens" />
            <PortfolioAssetsSmallBalancesSwitch onChange={onSmallBalancesChange} />
            {hasHiddenTokens && (
                <PortfolioAssetsHiddenTokensOption
                    hiddenTokenCount={hiddenTokenCount}
                    onPress={onHiddenTokensPress}
                />
            )}
        </>
    );
};
