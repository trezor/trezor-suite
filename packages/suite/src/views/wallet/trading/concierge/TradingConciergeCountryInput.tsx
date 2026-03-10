import { TradingCountryInput, TradingCountryInputProps } from '@suite/trading';

export const TradingConciergeCountryInput = (props: Omit<TradingCountryInputProps, 'label'>) => (
    <TradingCountryInput label="TR_TRADING_COUNTRY" {...props} />
);
