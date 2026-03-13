import { Translation, useTranslation } from '@suite/intl';
import {
    CardList,
    Column,
    IconCircle,
    Input,
    Modal,
    type ModalProps,
    Paragraph,
    Row,
    Text,
} from '@trezor/components';

import { useFiatCurrencyFilteredData } from './hooks/useFiatCurrencyFilteredData';
import { type CurrencyPickerOption } from './types/currencyPickerTypes';

type CurrencyPickerModalProps = ModalProps & {
    onCurrencySelect: (currency: CurrencyPickerOption) => void;
    options: CurrencyPickerOption[];
};

export const CurrencyPickerModal = ({
    onCurrencySelect,
    options,
    ...props
}: CurrencyPickerModalProps) => {
    const { translationString } = useTranslation();
    const { filteredData, setFilterValue, filterValue } = useFiatCurrencyFilteredData(options);
    const handleCurrencySelect = (currency: CurrencyPickerOption) => {
        onCurrencySelect(currency);
        props.onCancel?.();
    };

    return (
        <Modal {...props} width={400} heading={<Translation id="TR_CURRENCY" />} height="85vh">
            <Column gap={16} height="100%">
                <Input
                    onChange={ev => setFilterValue(ev.target.value)}
                    placeholder={translationString('TR_SEARCH_CURRENCY_PLACEHOLDER')}
                    onClear={() => setFilterValue('')}
                    showClearButton
                    value={filterValue}
                />

                {filteredData.length > 0 && (
                    <CardList>
                        {filteredData.map(option => (
                            <CardList.Item
                                key={option.value}
                                onClick={() => handleCurrencySelect(option)}
                                data-testid={`@trading/form/currency-picker/option/${option.value}`}
                            >
                                <Row gap={16}>
                                    <Column>
                                        <IconCircle name="coin" size={32} intent="neutral" />
                                    </Column>
                                    <Column>
                                        <Text typographyStyle="body-md">{option.label}</Text>
                                        <Text typographyStyle="body-sm" color="textSubdued">
                                            {option.shortLabel}
                                        </Text>
                                    </Column>
                                </Row>
                            </CardList.Item>
                        ))}
                    </CardList>
                )}
                {!filteredData.length && (
                    <Column justifyContent="center" flex="0.75">
                        <Paragraph align="center">
                            <Translation id="TR_CURRENCY_NOT_FOUND" />
                        </Paragraph>
                        <Paragraph align="center" typographyStyle="body-sm" color="textSubdued">
                            <Translation id="TR_CURRENCY_NOT_FOUND_DESCRIPTION" />
                        </Paragraph>
                    </Column>
                )}
            </Column>
        </Modal>
    );
};
