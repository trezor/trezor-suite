import { useState } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { type TradingCountryCode, getDefaultCountrySubdivision } from '@suite-common/trading';

import { CountrySubdivisionSelectModal } from './CountrySubdivisionSelectModal';
import { FormSelectRow } from '../FormSelectRow/FormSelectRow';

export type CountrySubdivisionSelectValue = string | undefined;

type CountrySubdivisionSelectProps = {
    country: TradingCountryCode;
    value: CountrySubdivisionSelectValue;
    onChange: (subdivision: string) => void;
    label: TranslationKey;
};

export const CountrySubdivisionSelect = ({
    country,
    value,
    onChange,
    label,
}: CountrySubdivisionSelectProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const subdivisionName = getDefaultCountrySubdivision(value, country)?.name;

    return (
        <>
            <FormSelectRow
                label={<Translation id={label} />}
                onClick={() => setIsModalOpen(true)}
                data-testid="@trading/form/country-subdivision-select"
            >
                {subdivisionName ?? (
                    <Translation id="TR_TRADING_COUNTRY_SUBDIVISION_NOT_SELECTED" />
                )}
            </FormSelectRow>
            {isModalOpen && (
                <CountrySubdivisionSelectModal
                    country={country}
                    heading={label}
                    onSelect={onChange}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
};
