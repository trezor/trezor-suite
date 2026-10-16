import { useState } from 'react';
import { type Control, useWatch } from 'react-hook-form';

import { useGetCountryName } from '@suite/trading';
import { getCountryFlag } from '@suite-common/flags';
import { TRADING_FORM_COUNTRY_SELECT } from '@suite-common/trading';
import { Translation, useTranslation } from '@suite-lego/intl';
import { Flag, GhostContainer, Icon, Row, Text } from '@trezor/components';
import { CaretRightIcon } from '@trezor/icons';

import { FakeSelect } from 'src/components/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { type TradingTradeBuySellType } from 'src/types/trading/trading';
import {
    type TradingBuySellFormProps,
    type TradingFormInputDefaultProps,
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
    const { control } = useTradingFormContext<TradingTradeBuySellType>();
    const getCountryName = useGetCountryName();

    const country = useWatch({
        control: control as Control<TradingBuySellFormProps>,
        name: TRADING_FORM_COUNTRY_SELECT,
    });

    const countryFlag = getCountryFlag(country?.value);
    const countryName = getCountryName(country);

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
                    <Row justifyContent="space-between" padding={{ vertical: 20, horizontal: 16 }}>
                        <Text
                            typographyStyle="body-sm"
                            align="start"
                            intent="neutral"
                            priority="secondary"
                        >
                            {label && <Translation id={label} />}
                        </Text>
                        <Row gap={16}>
                            <Row gap={8}>
                                {countryFlag && <Flag country={countryFlag} size={20} />}
                                <Text
                                    typographyStyle="body-sm"
                                    data-testid="@trading/form/country-select/value"
                                >
                                    {countryName}
                                </Text>
                            </Row>
                            <Icon
                                as={CaretRightIcon}
                                size={16}
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
