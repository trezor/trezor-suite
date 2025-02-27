import { UseFormSetValue } from 'react-hook-form';

import { Column, Grid, Paragraph, RadioCard } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { TranslationKey } from 'src/components/suite/Translation';
import {
    FORM_RATE_FIXED,
    FORM_RATE_FLOATING,
    FORM_RATE_TYPE,
} from 'src/constants/wallet/trading/form';
import { RateType, TradingExchangeFormProps } from 'src/types/trading/tradingForm';

type ItemProps = {
    isSelected: boolean;
    onClick: () => void;
    title: TranslationKey;
    label: TranslationKey;
};

const Item = ({ isSelected, onClick, title, label }: ItemProps) => (
    <RadioCard isActive={isSelected} onClick={onClick}>
        <Column alignItems="flex-start" gap={spacings.xxxs}>
            <Paragraph typographyStyle="highlight">
                <Translation id={title} />
            </Paragraph>
            <Paragraph typographyStyle="hint">
                <Translation id={label} />
            </Paragraph>
        </Column>
    </RadioCard>
);

type TradingFormSwitcherExchangeRatesProps = {
    rateType: RateType;
    setValue: UseFormSetValue<TradingExchangeFormProps>;
};

export const TradingFormSwitcherExchangeRates = ({
    rateType,
    setValue,
}: TradingFormSwitcherExchangeRatesProps) => {
    const floatingRateSelected = rateType === FORM_RATE_FLOATING;

    return (
        <Column gap={spacings.xs}>
            <Translation id="TR_TRADING_RATE" />
            <Grid columns={2} gap={spacings.sm}>
                <Item
                    isSelected={!floatingRateSelected}
                    onClick={() => setValue(FORM_RATE_TYPE, FORM_RATE_FIXED)}
                    title="TR_TRADING_FIX_RATE"
                    label="TR_TRADING_FIX_RATE_DESCRIPTION"
                />
                <Item
                    isSelected={floatingRateSelected}
                    onClick={() => setValue(FORM_RATE_TYPE, FORM_RATE_FLOATING)}
                    title="TR_TRADING_FLOATING_RATE"
                    label="TR_TRADING_FLOATING_RATE_DESCRIPTION"
                />
            </Grid>
        </Column>
    );
};
