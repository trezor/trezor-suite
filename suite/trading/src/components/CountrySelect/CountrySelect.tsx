import { useState } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { getCountryFlag } from '@suite-common/flags';
import { type TradingCountryCode, getDefaultCountry } from '@suite-common/trading';
import { Flag, Row } from '@trezor/components';

import { useGetCountryName } from '../../hooks/useGetCountryName';
import { CountrySelectModal } from '../../ui/Country/CountrySelectModal';
import { FormSelectRow } from '../FormSelectRow/FormSelectRow';

export type CountrySelectValue = TradingCountryCode;

type CountrySelectProps = {
    value: CountrySelectValue;
    onChange: (country: CountrySelectValue) => void;
    label: TranslationKey;
};

export const CountrySelect = ({ value, onChange, label }: CountrySelectProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const getCountryName = useGetCountryName();

    const countryOption = getDefaultCountry(value);
    const countryFlag = getCountryFlag(countryOption.value);

    return (
        <>
            <FormSelectRow
                label={<Translation id={label} />}
                onClick={() => setIsModalOpen(true)}
                data-testid="@trading/form/country-select"
            >
                <Row gap={8} alignItems="center">
                    {!!countryFlag && <Flag country={countryFlag} size={20} />}
                    {getCountryName(countryOption)}
                </Row>
            </FormSelectRow>
            {isModalOpen && (
                <CountrySelectModal
                    onCountrySelect={onChange}
                    onClose={() => setIsModalOpen(false)}
                    heading={label}
                />
            )}
        </>
    );
};
