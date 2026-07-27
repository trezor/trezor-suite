import { useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';

import { Translation, useTranslation } from '@suite/intl';
import {
    TRADING_FORM_COUNTRY_SUBDIVISION_SELECT,
    type TradingCountryOption,
} from '@suite-common/trading';
import { GhostContainer, Icon, Row, Text } from '@trezor/components';
import { CaretRightIcon } from '@trezor/icons';

import { FakeSelect } from 'src/components/suite';
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

    const subdivisionValue = useWatch({ name: TRADING_FORM_COUNTRY_SUBDIVISION_SELECT });

    const subdivisionLabel = useMemo(
        () =>
            subdivisionValue?.label ?? (
                <Translation id="TR_TRADING_COUNTRY_SUBDIVISION_NOT_SELECTED" />
            ),
        [subdivisionValue],
    );

    return (
        <>
            {renderInput && (
                <FakeSelect
                    value={subdivisionValue?.label ?? ''}
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
                        <Text
                            typographyStyle="body-md"
                            align="start"
                            intent="neutral"
                            priority="secondary"
                        >
                            <Translation id="TR_TRADING_COUNTRY_SUBDIVISION" />
                        </Text>
                        <Row gap={16}>
                            <Text
                                typographyStyle="body-md"
                                data-testid="@trading/form/country-subdivision-select/value"
                                intent="neutral"
                                priority="secondary"
                            >
                                {subdivisionLabel}
                            </Text>
                            <Icon
                                as={CaretRightIcon}
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
