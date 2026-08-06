import { Box, PictogramTitleHeader } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const TradeableAssetListEmptyComponent = () => (
    <Box padding="sp32" alignContent="center" justifyContent="center">
        <PictogramTitleHeader
            variant="info"
            icon="magnifyingGlass"
            title={<Translation id="moduleTrading.tradeableAssetsSheet.emptyTitleText" />}
            subtitle={<Translation id="moduleTrading.tradeableAssetsSheet.emptyDescriptionText" />}
        />
    </Box>
);
