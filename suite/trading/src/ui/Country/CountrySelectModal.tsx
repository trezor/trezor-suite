import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { getCountryFlag } from '@suite-common/flags';
import { type TradingCountryCode, useCountryFilteredData } from '@suite-common/trading';
import { Column, Flag, Input, Modal, Paragraph, Row } from '@trezor/components';
import { CardList } from '@trezor/product-components';

interface CountrySelectModalProps {
    onClose: () => void;
    onCountrySelect: (country: TradingCountryCode) => void;
    heading?: TranslationKey;
}

export const CountrySelectModal = ({
    heading,
    onCountrySelect,
    onClose,
}: CountrySelectModalProps) => {
    const { translationString } = useTranslation();
    const { filteredData, setFilterValue, filterValue } = useCountryFilteredData();

    const handleCountrySelect = (country: TradingCountryCode) => {
        onCountrySelect(country);
        onClose();
    };

    return (
        <Modal
            width={400}
            height="85vh"
            onCancel={onClose}
            heading={heading ? <Translation id={heading} /> : undefined}
        >
            <Column gap={16} height="100%">
                <Input
                    onChange={ev => setFilterValue(ev.target.value)}
                    placeholder={translationString('TR_SEARCH_COUNTRY_PLACEHOLDER')}
                    onClear={() => setFilterValue('')}
                    showClearButton
                    value={filterValue}
                />
                {filteredData.length > 0 ? (
                    <CardList>
                        {filteredData.map(country => (
                            <CardList.Item
                                key={country.value}
                                onClick={() => handleCountrySelect(country.value)}
                                data-testid={`@trading/form/country-select/option/${country.value}`}
                            >
                                <Row gap={16}>
                                    <Flag
                                        country={getCountryFlag(country.value) ?? 'UNKNOWN'}
                                        size={24}
                                    />
                                    {country.name}
                                </Row>
                            </CardList.Item>
                        ))}
                    </CardList>
                ) : (
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
