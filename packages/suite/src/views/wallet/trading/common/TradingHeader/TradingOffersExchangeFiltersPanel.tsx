import styled from 'styled-components';

import {
    TRADING_EXCHANGE_COMPARATOR_KYC_FILTER,
    TRADING_EXCHANGE_COMPARATOR_KYC_FILTER_ALL,
    TRADING_EXCHANGE_COMPARATOR_KYC_FILTER_NO_KYC,
    TRADING_EXCHANGE_COMPARATOR_RATE_FILTER,
    TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_ALL,
    TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_DEX,
    TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_FIXED_CEX,
    TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_FLOATING_CEX,
    type TradingExchangeType,
} from '@suite-common/trading';
import { Row, Select } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';

const SelectWrapper = styled.div`
    width: 224px;
`;

const kycOptions = [
    {
        label: <Translation id="TR_TRADING_EXCHANGE_COMPARATOR_FILTER_KYC_ALL" />,
        value: TRADING_EXCHANGE_COMPARATOR_KYC_FILTER_ALL,
    },
    {
        label: <Translation id="TR_TRADING_EXCHANGE_COMPARATOR_FILTER_NO_KYC" />,
        value: TRADING_EXCHANGE_COMPARATOR_KYC_FILTER_NO_KYC,
    },
];

const offerTypeOptions = [
    {
        label: <Translation id="TR_TRADING_EXCHANGE_COMPARATOR_FILTER_RATE_ALL" />,
        value: TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_ALL,
    },
    {
        label: <Translation id="TR_TRADING_EXCHANGE_COMPARATOR_FILTER_RATE_FIXED_CEX" />,
        value: TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_FIXED_CEX,
    },
    {
        label: <Translation id="TR_TRADING_EXCHANGE_COMPARATOR_FILTER_RATE_FLOATING_CEX" />,
        value: TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_FLOATING_CEX,
    },
    {
        label: <Translation id="TR_TRADING_EXCHANGE_COMPARATOR_FILTER_RATE_DEX" />,
        value: TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_DEX,
    },
];

export const TradingOffersExchangeFiltersPanel = () => {
    const context = useTradingFormContext<TradingExchangeType>();
    const { getValues, setValue } = context;
    const kycValue = getValues(TRADING_EXCHANGE_COMPARATOR_KYC_FILTER);
    const exchangeType = getValues(TRADING_EXCHANGE_COMPARATOR_RATE_FILTER);
    const selectedRateOption = offerTypeOptions.find(offer => offer.value === exchangeType);
    const selectedKycOption = kycOptions.find(offer => offer.value === kycValue);

    return (
        <Row alignItems="center" gap={spacings.md} flexWrap="wrap">
            <SelectWrapper>
                <Select
                    useKeyPressScroll
                    value={selectedRateOption}
                    onChange={option =>
                        setValue(TRADING_EXCHANGE_COMPARATOR_RATE_FILTER, option.value)
                    }
                    options={offerTypeOptions}
                />
            </SelectWrapper>
            <SelectWrapper>
                <Select
                    useKeyPressScroll
                    value={selectedKycOption}
                    onChange={option =>
                        setValue(TRADING_EXCHANGE_COMPARATOR_KYC_FILTER, option.value)
                    }
                    options={kycOptions}
                />
            </SelectWrapper>
        </Row>
    );
};
