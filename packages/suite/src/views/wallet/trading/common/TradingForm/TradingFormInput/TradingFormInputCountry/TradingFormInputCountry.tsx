import { useState } from 'react';
import { Control, useWatch } from 'react-hook-form';

import { Translation, useTranslation } from '@suite/intl';
import { TRADING_FORM_COUNTRY_SELECT } from '@suite-common/trading';
import { GhostContainer, Icon, Row, Text } from '@trezor/components';

import { FakeSelect } from 'src/components/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
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

    const countryValue = useWatch({
        control: control as Control<TradingBuySellFormProps>,
        name: TRADING_FORM_COUNTRY_SELECT,
    });

    return (
        <>
            {renderInput && (
                <FakeSelect
                    value={countryValue?.shortLabel ?? defaultCountry?.shortLabel ?? ''}
                    placeholder={label ? translationString(label) : undefined}
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
                        <Row gap={16}>
                            <Text
                                typographyStyle="body-md"
                                data-testid="@trading/form/country-select/value"
                            >
                                {countryValue?.shortLabel ?? defaultCountry?.shortLabel ?? ''}
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
