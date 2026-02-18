import { useState } from 'react';

import { Translation } from '@suite/intl';
import { TRADING_FORM_COUNTRY_SELECT } from '@suite-common/trading';
import { GhostContainer, Icon, Row, Text } from '@trezor/components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingTradeBuySellType } from 'src/types/trading/trading';
import { TradingFormInputDefaultProps } from 'src/types/trading/tradingForm';

import { CountrySelectModal } from './CountrySelectModal';

export const TradingFormInputCountry = ({ label }: TradingFormInputDefaultProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { watch, defaultCountry } = useTradingFormContext<TradingTradeBuySellType>();

    const countryValue = watch()[TRADING_FORM_COUNTRY_SELECT];

    return (
        <>
            <GhostContainer onClick={() => setIsModalOpen(true)} borderRadius={0}>
                <Row alignItems="center" justifyContent="space-between" padding={20}>
                    <Text typographyStyle="body" align="start">
                        {label && <Translation id={label} />}
                    </Text>

                    <Row gap={16}>
                        <Text typographyStyle="body">
                            {countryValue?.label ?? defaultCountry?.label ?? ''}
                        </Text>
                        <Icon name="caretRight" size={20} variant="tertiary" />
                    </Row>
                </Row>
            </GhostContainer>
            {isModalOpen && (
                <CountrySelectModal onClose={() => setIsModalOpen(false)} heading={label} />
            )}
        </>
    );
};
