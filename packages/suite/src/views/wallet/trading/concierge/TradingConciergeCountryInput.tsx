import { TradingCountryInput, TradingCountryInputProps } from '@suite/trading';
import { Column } from '@trezor/components';

export const TradingConciergeCountryInput = (props: Omit<TradingCountryInputProps, 'label'>) => (
    <Column hasDivider>
        <TradingCountryInput label="TR_TRADING_COUNTRY" {...props} />
    </Column>
);
