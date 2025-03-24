import { UseFormSetValue } from 'react-hook-form';

import {
    TRADING_EXCHANGE_RATE,
    TRADING_EXCHANGE_RATE_FIXED,
    TRADING_EXCHANGE_RATE_FLOATING,
    TradingExchangeFormProps,
    TradingExchangeRateType,
} from '@suite-common/trading';
import { Column, Grid, Paragraph, RadioCard } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { TranslationKey } from 'src/components/suite/Translation';

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
    rateType: TradingExchangeRateType;
    setValue: UseFormSetValue<TradingExchangeFormProps>;
};

export const TradingFormSwitcherExchangeRates = ({
    rateType,
    setValue,
}: TradingFormSwitcherExchangeRatesProps) => {
    const floatingRateSelected = rateType === TRADING_EXCHANGE_RATE_FLOATING;

    return (
        <Column gap={spacings.xs}>
            <Translation id="TR_TRADING_RATE" />
            <Grid columns={2} gap={spacings.sm}>
                <Item
                    isSelected={!floatingRateSelected}
                    onClick={() => setValue(TRADING_EXCHANGE_RATE, TRADING_EXCHANGE_RATE_FIXED)}
                    title="TR_TRADING_FIX_RATE"
                    label="TR_TRADING_FIX_RATE_DESCRIPTION"
                />
                <Item
                    isSelected={floatingRateSelected}
                    onClick={() => setValue(TRADING_EXCHANGE_RATE, TRADING_EXCHANGE_RATE_FLOATING)}
                    title="TR_TRADING_FLOATING_RATE"
                    label="TR_TRADING_FLOATING_RATE_DESCRIPTION"
                />
            </Grid>
        </Column>
    );
};
