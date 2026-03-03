import { useState } from 'react';
import { Control, useWatch } from 'react-hook-form';

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
    const { control, defaultCountry } = useTradingFormContext<TradingTradeBuySellType>();
    const getCountryName = useGetCountryName();

    const countryValue = useWatch({
        control: control as Control<TradingBuySellFormProps>,
        name: TRADING_FORM_COUNTRY_SELECT,
    });

    const countryCode = countryValue?.value ?? defaultCountry?.value ?? '';
    const countryFlag = getCountryFlag(countryCode);
    const countryName = getCountryName(countryValue ?? defaultCountry);

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
