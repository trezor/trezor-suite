import { useState } from 'react';

import { Translation, TranslationKey, useTranslation } from '@suite/intl';
import { TradingCountryCode, getDefaultCountry } from '@suite-common/trading';
import {
    Flag,
    GhostContainer,
    Icon,
    Row,
    SkeletonRectangle,
    Text,
    getCountryFlag,
} from '@trezor/components';

import { CountrySelectModal } from './CountrySelectModal';
import { useGetCountryName } from '../../hooks';
import { FakeSelect } from '../Form/FakeSelect';

export interface TradingCountryInputProps {
    country: TradingCountryCode;
    label: TranslationKey;
    onChange: (country: TradingCountryCode) => void;
    renderInput?: boolean;
    isLoading?: boolean;
}

export const TradingCountryInput = ({
    country,
    onChange,
    label,
    renderInput = false,
    isLoading = false,
}: TradingCountryInputProps) => {
    const { translationString } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const getCountryName = useGetCountryName();

    const handleChange = (nextCountry: TradingCountryCode) => {
        onChange(nextCountry);
        setIsModalOpen(false);
    };

    const countryOption = getDefaultCountry(country);
    const countryFlag = getCountryFlag(countryOption.value);
    const countryName = getCountryName(countryOption);

    return (
        <>
            {renderInput && (
                <FakeSelect
                    value={countryName}
                    onClick={() => setIsModalOpen(true)}
                    placeholder={translationString(label)}
                    isDisabled={isLoading}
                />
            )}
            {!renderInput && (
                <GhostContainer
                    onClick={() => setIsModalOpen(true)}
                    borderRadius={0}
                    data-testid="@trading/form/country-select"
                    isDisabled={isLoading}
                >
                    <Row justifyContent="space-between" padding={20}>
                        <Text typographyStyle="body-md" align="start">
                            <Translation id={label} />
                        </Text>
                        {isLoading ? (
                            <SkeletonRectangle animate />
                        ) : (
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
                        )}
                    </Row>
                </GhostContainer>
            )}
            {isModalOpen && (
                <CountrySelectModal
                    onCountrySelect={handleChange}
                    onClose={() => setIsModalOpen(false)}
                    heading={label}
                />
            )}
        </>
    );
};
