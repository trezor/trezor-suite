import { type UseFormSetValue } from 'react-hook-form';

import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { useGetCountryName } from '@suite/trading';
import { getCountryFlag } from '@suite-common/flags';
import { useDispatch } from '@suite-common/redux-utils';
import {
    TRADING_FORM_COUNTRY_SELECT,
    TRADING_FORM_COUNTRY_SUBDIVISION_SELECT,
    type TradingCountryOption,
    tradingThunks,
    useCountryFilteredData,
} from '@suite-common/trading';
import { Column, Flag, Icon, Input, Modal, Paragraph, Row } from '@trezor/components';
import { MagnifyingGlassIcon } from '@trezor/icons';
import { CardList } from '@trezor/product-components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { type TradingTradeBuySellType } from 'src/types/trading/trading';
import { type TradingBuySellFormProps } from 'src/types/trading/tradingForm';

interface CountrySelectModalProps {
    onClose: () => void;
    heading?: TranslationKey;
}

export const CountrySelectModal = ({ heading, onClose }: CountrySelectModalProps) => {
    const { translationString } = useTranslation();
    const dispatch = useDispatch();
    const { setValue, type } = useTradingFormContext<TradingTradeBuySellType>();
    const { filteredData, setFilterValue, filterValue } = useCountryFilteredData();
    const getCountryName = useGetCountryName();

    const selectCountry = (country: TradingCountryOption) => {
        const setValueTyped = setValue as UseFormSetValue<TradingBuySellFormProps>;
        setValueTyped(TRADING_FORM_COUNTRY_SELECT, country, { shouldDirty: true });
        setValueTyped(TRADING_FORM_COUNTRY_SUBDIVISION_SELECT, undefined, { shouldDirty: true });
        dispatch(tradingThunks.clearQuotesAndParamsByTradingTypeThunk({ tradingType: type }));
        onClose();
    };

    return (
        <Modal
            width={400}
            maxHeight={680}
            onCancel={onClose}
            heading={heading ? <Translation id={heading} /> : undefined}
        >
            <Column gap={16} height="100%">
                <Input
                    onChange={ev => setFilterValue(ev.target.value)}
                    placeholder={translationString('TR_SEARCH_COUNTRY_PLACEHOLDER')}
                    leftContent={
                        <Icon
                            as={MagnifyingGlassIcon}
                            intent="neutral"
                            priority="secondary"
                            size={16}
                        />
                    }
                    onClear={() => setFilterValue('')}
                    showClearButton
                    value={filterValue}
                />
                {filteredData.length > 0 && (
                    <CardList>
                        {filteredData.map(country => {
                            const countryFlag = getCountryFlag(country.value);
                            const countryName = getCountryName(country, true);

                            return (
                                <CardList.Item
                                    key={country.value}
                                    onClick={() => selectCountry(country)}
                                    data-testid={`@trading/form/country-select/option/${country.value}`}
                                >
                                    <Row gap={12}>
                                        {countryFlag && <Flag country={countryFlag} size={24} />}
                                        {countryName}
                                    </Row>
                                </CardList.Item>
                            );
                        })}
                    </CardList>
                )}
                {!filteredData.length && (
                    <Column justifyContent="center" flex="0.75">
                        <Paragraph align="center">
                            <Translation id="TR_TRADING_COUNTRY_NOT_FOUND" />
                        </Paragraph>
                        <Paragraph
                            align="center"
                            typographyStyle="body-sm"
                            color="contentSecondary"
                        >
                            <Translation id="TR_TRADING_COUNTRY_NOT_FOUND_DESCRIPTION" />
                        </Paragraph>
                    </Column>
                )}
            </Column>
        </Modal>
    );
};
