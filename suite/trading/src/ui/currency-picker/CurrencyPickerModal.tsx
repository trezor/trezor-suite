import { Translation, useTranslation } from '@suite/intl';
import { getFiatCurrencyFlag } from '@suite-common/flags';
import {
    CardList,
    Column,
    Flag,
    IconCircle,
    Input,
    Modal,
    type ModalProps,
    Paragraph,
    Row,
    Text,
} from '@trezor/components';
import { CoinIcon } from '@trezor/icons';

import { useFiatCurrencyFilteredData } from './hooks/useFiatCurrencyFilteredData';
import { type CurrencyPickerOption } from './types/currencyPickerTypes';

type CurrencyPickerModalProps = ModalProps & {
    onCurrencySelect: (currency: CurrencyPickerOption) => void;
    options: CurrencyPickerOption[];
};

type FiatCurrencyFlagInput = Parameters<typeof getFiatCurrencyFlag>[0];

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
        <Modal {...props} width={400} heading={<Translation id="TR_CURRENCY" />} maxHeight={680}>
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
                        {filteredData.map(option => {
                            const flag = getFiatCurrencyFlag(option.value as FiatCurrencyFlagInput);

                            return (
                                <CardList.Item
                                    key={option.value}
                                    paddingType="medium"
                                    onClick={() => handleCurrencySelect(option)}
                                    data-testid={`@trading/form/currency-picker/option/${option.value}`}
                                >
                                    <Row gap={16}>
                                        <Column>
                                            {flag ? (
                                                <Flag country={flag} size={32} />
                                            ) : (
                                                <IconCircle
                                                    icon={CoinIcon}
                                                    size={32}
                                                    intent="neutral"
                                                />
                                            )}
                                        </Column>
                                        <Column>
                                            <Text typographyStyle="body-md">{option.label}</Text>
                                            <Text
                                                typographyStyle="body-sm"
                                                color="contentSecondary"
                                            >
                                                {option.shortLabel}
                                            </Text>
                                        </Column>
                                    </Row>
                                </CardList.Item>
                            );
                        })}
                    </CardList>
                )}
                {!filteredData.length && (
                    <Column justifyContent="center" flex="0.75">
                        <Paragraph align="center">
                            <Translation id="TR_CURRENCY_NOT_FOUND" />
                        </Paragraph>
                        <Paragraph
                            align="center"
                            typographyStyle="body-sm"
                            color="contentSecondary"
                        >
                            <Translation id="TR_CURRENCY_NOT_FOUND_DESCRIPTION" />
                        </Paragraph>
                    </Column>
                )}
            </Column>
        </Modal>
    );
};
