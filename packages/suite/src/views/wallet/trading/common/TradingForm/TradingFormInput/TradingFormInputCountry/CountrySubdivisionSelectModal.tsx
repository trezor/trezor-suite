import { UseFormSetValue } from 'react-hook-form';

import { Translation, useTranslation } from '@suite/intl';
import {
    TRADING_FORM_COUNTRY_SUBDIVISION_SELECT,
    TradingCountryOption,
    TradingCountrySubdivisionOption,
    useCountrySubdivisionFilteredData,
} from '@suite-common/trading';
import { CardList, Column, Input, Modal, Paragraph, Text } from '@trezor/components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingTradeBuySellType } from 'src/types/trading/trading';
import { TradingBuySellFormProps } from 'src/types/trading/tradingForm';

interface CountrySubdivisionSelectModalProps {
    onClose: () => void;
    country: TradingCountryOption;
}

export const CountrySubdivisionSelectModal = ({
    onClose,
    country,
}: CountrySubdivisionSelectModalProps) => {
    const { translationString } = useTranslation();
    const { setValue, setAmountLimits } = useTradingFormContext<TradingTradeBuySellType>();
    const { filteredData, setFilterValue, filterValue } = useCountrySubdivisionFilteredData(
        country.value,
    );

    const selectSubdivision = (subdivision: TradingCountrySubdivisionOption) => {
        const setValueTyped = setValue as UseFormSetValue<TradingBuySellFormProps>;
        setValueTyped(TRADING_FORM_COUNTRY_SUBDIVISION_SELECT, subdivision, { shouldDirty: true });
        setAmountLimits(undefined);
        onClose();
    };

    return (
        <Modal
            heading={<Translation id="TR_TRADING_COUNTRY_SUBDIVISION" />}
            onCancel={onClose}
            height="85vh"
            width={400}
        >
            <Column gap={12}>
                <Input
                    value={filterValue}
                    onChange={event => setFilterValue(event.target.value)}
                    placeholder={translationString('TR_SEARCH_COUNTRY_PLACEHOLDER')}
                />
                {filteredData.length > 0 && (
                    <CardList>
                        {filteredData.map(subdivision => (
                            <CardList.Item
                                key={subdivision.value}
                                onClick={() => selectSubdivision(subdivision)}
                                data-testid={`@trading/form/country-subdivision-select/option/${subdivision.value}`}
                            >
                                <Text>{subdivision.name}</Text>
                            </CardList.Item>
                        ))}
                    </CardList>
                )}
                {!filteredData.length && (
                    <Column justifyContent="center">
                        <Paragraph align="center">
                            <Translation id="TR_TRADING_COUNTRY_SUBDIVISION_NOT_FOUND" />
                        </Paragraph>
                        <Paragraph align="center" typographyStyle="body-sm" color="textSubdued">
                            <Translation id="TR_TRADING_COUNTRY_NOT_FOUND_DESCRIPTION" />
                        </Paragraph>
                    </Column>
                )}
            </Column>
        </Modal>
    );
};
