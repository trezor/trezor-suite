import styled from 'styled-components';

import type { TradingExchangeType } from '@suite-common/invity';
import { Row, Select } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import {
    EXCHANGE_COMPARATOR_KYC_FILTER,
    EXCHANGE_COMPARATOR_KYC_FILTER_ALL,
    EXCHANGE_COMPARATOR_KYC_FILTER_NO_KYC,
    EXCHANGE_COMPARATOR_RATE_FILTER,
    EXCHANGE_COMPARATOR_RATE_FILTER_ALL,
    EXCHANGE_COMPARATOR_RATE_FILTER_DEX,
    EXCHANGE_COMPARATOR_RATE_FILTER_FIXED_CEX,
    EXCHANGE_COMPARATOR_RATE_FILTER_FLOATING_CEX,
} from 'src/constants/wallet/trading/form';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';

const SelectWrapper = styled.div`
    width: 224px;
`;

const kycOptions = [
    {
        label: <Translation id="TR_TRADING_EXCHANGE_COMPARATOR_FILTER_KYC_ALL" />,
        value: EXCHANGE_COMPARATOR_KYC_FILTER_ALL,
    },
    {
        label: <Translation id="TR_TRADING_EXCHANGE_COMPARATOR_FILTER_NO_KYC" />,
        value: EXCHANGE_COMPARATOR_KYC_FILTER_NO_KYC,
    },
];

const offerTypeOptions = [
    {
        label: <Translation id="TR_TRADING_EXCHANGE_COMPARATOR_FILTER_RATE_ALL" />,
        value: EXCHANGE_COMPARATOR_RATE_FILTER_ALL,
    },
    {
        label: <Translation id="TR_TRADING_EXCHANGE_COMPARATOR_FILTER_RATE_FIXED_CEX" />,
        value: EXCHANGE_COMPARATOR_RATE_FILTER_FIXED_CEX,
    },
    {
        label: <Translation id="TR_TRADING_EXCHANGE_COMPARATOR_FILTER_RATE_FLOATING_CEX" />,
        value: EXCHANGE_COMPARATOR_RATE_FILTER_FLOATING_CEX,
    },
    {
        label: <Translation id="TR_TRADING_EXCHANGE_COMPARATOR_FILTER_RATE_DEX" />,
        value: EXCHANGE_COMPARATOR_RATE_FILTER_DEX,
    },
];

export const TradingOffersExchangeFiltersPanel = () => {
    const context = useTradingFormContext<TradingExchangeType>();
    const { getValues, setValue } = context;
    const kycValue = getValues(EXCHANGE_COMPARATOR_KYC_FILTER);
    const exchangeType = getValues(EXCHANGE_COMPARATOR_RATE_FILTER);
    const selectedRateOption = offerTypeOptions.find(offer => offer.value === exchangeType);
    const selectedKycOption = kycOptions.find(offer => offer.value === kycValue);

    return (
        <Row alignItems="center" gap={spacings.md} flexWrap="wrap">
            <SelectWrapper>
                <Select
                    useKeyPressScroll
                    value={selectedRateOption}
                    onChange={option => setValue(EXCHANGE_COMPARATOR_RATE_FILTER, option.value)}
                    options={offerTypeOptions}
                />
            </SelectWrapper>
            <SelectWrapper>
                <Select
                    useKeyPressScroll
                    value={selectedKycOption}
                    onChange={option => setValue(EXCHANGE_COMPARATOR_KYC_FILTER, option.value)}
                    options={kycOptions}
                />
            </SelectWrapper>
        </Row>
    );
};
