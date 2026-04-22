import { useMemo, useState } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import {
    TRADING_FORM_COUNTRY_SUBDIVISION_SELECT,
    type TradingCountryOption,
} from '@suite-common/trading';
import { GhostContainer, Icon, Row, Text } from '@trezor/components';

import { FakeSelect } from 'src/components/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { type TradingTradeBuySellType } from 'src/types/trading/trading';
import { type TradingFormInputDefaultProps } from 'src/types/trading/tradingForm';

import { CountrySubdivisionSelectModal } from './CountrySubdivisionSelectModal';

interface TradingFormInputCountrySubdivisionProps extends TradingFormInputDefaultProps {
    renderInput?: boolean;
    country: TradingCountryOption;
}

export const TradingFormInputCountrySubdivision = ({
    label,
    renderInput = false,
    country,
}: TradingFormInputCountrySubdivisionProps) => {
    const { translationString } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { watch, defaultSubdivision } = useTradingFormContext<TradingTradeBuySellType>();

    const subdivisionValue = watch()[TRADING_FORM_COUNTRY_SUBDIVISION_SELECT];

    const subdivisionLabel = useMemo(() => {
        const resolvedLabel = subdivisionValue?.label ?? defaultSubdivision?.label;

        return (
            resolvedLabel ?? (
                <Text color="contentSecondary">
                    <Translation id="TR_TRADING_COUNTRY_SUBDIVISION_NOT_SELECTED" />
                </Text>
            )
        );
    }, [subdivisionValue, defaultSubdivision]);

    return (
        <>
            {renderInput && (
                <FakeSelect
                    value={subdivisionValue?.label ?? defaultSubdivision?.label ?? ''}
                    placeholder={label ? translationString(label) : undefined}
                    onClick={() => setIsModalOpen(true)}
                    data-testid="@trading/form/country-subdivision-select"
                />
            )}
            {!renderInput && (
                <GhostContainer
                    onClick={() => setIsModalOpen(true)}
                    borderRadius={0}
                    data-testid="@trading/form/country-subdivision-select"
                >
                    <Row justifyContent="space-between" padding={20}>
                        <Text typographyStyle="body-md" align="start">
                            <Translation id="TR_TRADING_COUNTRY_SUBDIVISION" />
                        </Text>
                        <Row gap={16}>
                            <Text
                                typographyStyle="body-md"
                                data-testid="@trading/form/country-subdivision-select/value"
                            >
                                {subdivisionLabel}
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
                <CountrySubdivisionSelectModal
                    onClose={() => setIsModalOpen(false)}
                    country={country}
                />
            )}
        </>
    );
};
