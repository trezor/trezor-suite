import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import {
    type TradingRootState as TradingRootStateCommon,
    selectTradingProviderByNameAndTradeType,
    selectTradingProviderKycPolicy,
} from '@suite-common/trading';
import { HStack, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { OverviewRow, OverviewValueSkeleton, ProviderLogo } from '@suite-native/trading-atoms';

import { getKycPolicyWarningTranslation } from '../../utils/general/kycUtils';

type ExchangeProviderPickerRightProps = {
    isLoading: boolean;
    selectedValue: ExchangeTrade | undefined;
};

export type ExchangeProviderPickerProps = ExchangeProviderPickerRightProps & {
    handleProviderPress: () => void;
};

const PROVIDER_PICKER_TEST_ID = '@trading/exchange/provider-picker';

const ExchangeProviderPickerRight = ({
    isLoading,
    selectedValue,
}: ExchangeProviderPickerRightProps) => {
    const { translate } = useTranslate();
    const { exchange } = selectedValue ?? {};
    const provider = useSelector((state: TradingRootStateCommon) =>
        selectTradingProviderByNameAndTradeType(state, exchange, 'exchange'),
    );

    if (isLoading) {
        return <OverviewValueSkeleton />;
    }

    invariant(provider, 'Selected provider should be defined');
    const { companyName, logo } = provider;

    return (
        <HStack>
            <ProviderLogo logo={logo} />
            <Text
                color="textSubdued"
                variant="body-sm"
                accessibilityLabel={translate('moduleTrading.tradingScreen.selectedProvider')}
            >
                {companyName}
            </Text>
        </HStack>
    );
};

export const ExchangeProviderPicker = ({
    isLoading,
    selectedValue,
    handleProviderPress,
}: ExchangeProviderPickerProps) => {
    const { translate } = useTranslate();

    const kycPolicy = useSelector((state: TradingRootStateCommon) =>
        selectTradingProviderKycPolicy(state, selectedValue?.exchange, 'exchange'),
    );

    if (!selectedValue && !isLoading) {
        return null;
    }

    const warning = isLoading ? undefined : getKycPolicyWarningTranslation(kycPolicy);

    return (
        <>
            <OverviewRow
                title={translate('moduleTrading.tradingScreen.provider')}
                noBottomBorder
                onPress={handleProviderPress}
                noCaret={isLoading}
                warning={warning}
                testID={PROVIDER_PICKER_TEST_ID}
            >
                <ExchangeProviderPickerRight isLoading={isLoading} selectedValue={selectedValue} />
            </OverviewRow>
        </>
    );
};
