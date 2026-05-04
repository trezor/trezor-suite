import { type OtcProviderType } from '@suite-common/trading';
import { Box, InlineAlertBox, Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { OverviewRow, useBottomSheetControls } from '@suite-native/trading-atoms';

import { ConciergeProviderSheet } from './ConciergeProviderSheet';
import { useConciergeProviders } from '../../hooks/concierge/useConciergeProviders';

const PROVIDER_PICKER_TEST_ID = '@trading/concierge/provider-picker';
const PROVIDER_SHEET_TEST_ID = `${PROVIDER_PICKER_TEST_ID}/bottom-sheet`;

export const ConciergeProviderPicker = () => {
    const { translate } = useTranslate();
    const { isSheetVisible, hideSheet, showSheet } = useBottomSheetControls();
    const { providers, selectedProvider, setSelectedProvider } = useConciergeProviders();

    const handleProviderSelect = (provider: OtcProviderType) => {
        setSelectedProvider(provider);
        hideSheet();
    };

    return (
        <>
            {selectedProvider ? (
                <OverviewRow
                    title={translate('moduleTrading.tradingScreen.provider')}
                    noBottomBorder
                    noCaret={!selectedProvider}
                    onPress={showSheet}
                    testID={PROVIDER_PICKER_TEST_ID}
                >
                    <Text
                        color="contentSecondary"
                        variant="body-sm"
                        numberOfLines={1}
                        testID={PROVIDER_PICKER_TEST_ID + '/value'}
                    >
                        {selectedProvider.name}
                    </Text>
                </OverviewRow>
            ) : (
                <Box paddingHorizontal="sp20" paddingVertical="sp18">
                    <InlineAlertBox
                        variant="warning"
                        title={
                            <Translation id="moduleTrading.tradingScreen.concierge.noProvidersAvailable" />
                        }
                        accessibilityHint={translate('generic.warning')}
                    />
                </Box>
            )}
            <ConciergeProviderSheet
                isVisible={isSheetVisible}
                onClose={hideSheet}
                providers={providers}
                onProviderSelect={handleProviderSelect}
                testID={PROVIDER_SHEET_TEST_ID}
            />
        </>
    );
};
