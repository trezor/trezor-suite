import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { type TradingCountryCode, useCountrySubdivisionFilteredData } from '@suite-common/trading';
import { CardList, Column, Icon, Input, Modal, Paragraph, Text } from '@trezor/components';
import { MagnifyingGlassIcon } from '@trezor/icons';

type CountrySubdivisionSelectModalProps = {
    country: TradingCountryCode;
    heading: TranslationKey;
    onSelect: (subdivision: string) => void;
    onClose: () => void;
};

export const CountrySubdivisionSelectModal = ({
    country,
    heading,
    onSelect,
    onClose,
}: CountrySubdivisionSelectModalProps) => {
    const { translationString } = useTranslation();
    const { filteredData, setFilterValue, filterValue } =
        useCountrySubdivisionFilteredData(country);

    const handleSelect = (subdivision: string) => {
        onSelect(subdivision);
        onClose();
    };

    return (
        <Modal
            heading={<Translation id={heading} />}
            onCancel={onClose}
            maxHeight={680}
            width={400}
        >
            <Column gap={12} height="100%">
                <Input
                    value={filterValue}
                    onChange={event => setFilterValue(event.target.value)}
                    placeholder={translationString('TR_SEARCH_COUNTRY_SUBDIVISION_PLACEHOLDER')}
                    leftContent={
                        <Icon
                            as={MagnifyingGlassIcon}
                            intent="neutral"
                            priority="secondary"
                            size={16}
                        />
                    }
                />
                {filteredData.length > 0 ? (
                    <CardList>
                        {filteredData.map(subdivision => (
                            <CardList.Item
                                key={subdivision.value}
                                onClick={() => handleSelect(subdivision.value)}
                                data-testid={`@trading/form/country-subdivision-select/option/${subdivision.value}`}
                            >
                                <Text>{subdivision.name}</Text>
                            </CardList.Item>
                        ))}
                    </CardList>
                ) : (
                    <Column justifyContent="center" flex="0.75">
                        <Paragraph align="center">
                            <Translation id="TR_TRADING_COUNTRY_SUBDIVISION_NOT_FOUND" />
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
