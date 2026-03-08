import { useEffect, useState } from 'react';
import { Control, UseFormSetValue, useWatch } from 'react-hook-form';

import { Translation, useTranslation } from '@suite/intl';
import { TRADING_FORM_COUNTRY_SELECT } from '@suite-common/trading';
import { Flag, GhostContainer, Icon, Row, Text, getCountryFlag } from '@trezor/components';

import { FakeSelect } from 'src/components/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useGetCountryName } from 'src/hooks/wallet/trading/useGetCountryName';
import { TradingTradeBuySellType } from 'src/types/trading/trading';
import {
    TradingBuySellFormProps,
    TradingFormInputDefaultProps,
} from 'src/types/trading/tradingForm';

import { CountrySelectModal } from './CountrySelectModal';

interface TradingFormInputCountryProps extends TradingFormInputDefaultProps {
    renderInput?: boolean;
}

export const TradingFormInputCountry = ({
    label,
    renderInput = false,
}: TradingFormInputCountryProps) => {
    const { translationString } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const {
        control,
        defaultCountry,
        setValue,
        methods: {
            formState: { dirtyFields },
        },
    } = useTradingFormContext<TradingTradeBuySellType>();
    const getCountryName = useGetCountryName();

    const countryValue = useWatch({
        control: control as Control<TradingBuySellFormProps>,
        name: TRADING_FORM_COUNTRY_SELECT,
    });

    const country = countryValue ?? defaultCountry;
    const countryFlag = getCountryFlag(country?.value);
    const countryName = getCountryName(country);

    useEffect(() => {
        if (!dirtyFields[TRADING_FORM_COUNTRY_SELECT]) {
            const setValueTyped = setValue as UseFormSetValue<TradingBuySellFormProps>;
            setValueTyped(TRADING_FORM_COUNTRY_SELECT, defaultCountry, { shouldDirty: false });
        }
    }, [defaultCountry, dirtyFields, setValue]);

    return (
        <>
            {renderInput && (
                <FakeSelect
                    value={countryName}
                    placeholder={label ? translationString(label) : undefined}
                    leftContent={countryFlag && <Flag country={countryFlag} size={24} />}
                    onClick={() => setIsModalOpen(true)}
                    data-testid="@trading/form/country-select"
                />
            )}
            {!renderInput && (
                <GhostContainer
                    onClick={() => setIsModalOpen(true)}
                    borderRadius={0}
                    data-testid="@trading/form/country-select"
                >
                    <Row justifyContent="space-between" padding={20}>
                        <Text typographyStyle="body-md" align="start">
                            {label && <Translation id={label} />}
                        </Text>
                        <Row gap={4}>
                            {countryFlag && <Flag country={countryFlag} size={24} />}
                            <Text
                                typographyStyle="body-md"
                                data-testid="@trading/form/country-select/value"
                            >
                                {countryName}
                            </Text>
                            <Icon
                                name="caretRight"
                                size={20}
                                intent="neutral"
                                priority="secondary"
                            />
                        </Row>
                    </Row>
                </GhostContainer>
            )}
            {isModalOpen && (
                <CountrySelectModal onClose={() => setIsModalOpen(false)} heading={label} />
            )}
        </>
    );
};
