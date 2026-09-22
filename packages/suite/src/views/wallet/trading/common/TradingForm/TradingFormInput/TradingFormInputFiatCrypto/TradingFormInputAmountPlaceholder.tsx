import { useFormContext } from 'react-hook-form';

import { selectLanguage } from '@suite/settings';
import { selectTradingLoadingAndTimestamp } from '@suite-common/trading';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Spinner } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';
import {
    type TradingAllFormProps,
    type TradingFormInputFiatCryptoProps,
} from 'src/types/trading/tradingForm';
import {
    TRADING_AMOUNT_PLACEHOLDER,
    tradingAmountInputStyle,
} from 'src/views/wallet/trading/common/TradingForm/tradingFormInputsUtils';

type TradingFormInputAmountPlaceholderProps = {
    name: TradingFormInputFiatCryptoProps['cryptoInputName' | 'fiatInputName'];
};

export const TradingFormInputAmountPlaceholder = ({
    name,
}: TradingFormInputAmountPlaceholderProps) => {
    const locale = useSelector(selectLanguage);
    const { isLoading } = useSelector(selectTradingLoadingAndTimestamp);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const isBusy = isLoading || isDiscoveryRunning;
    const { control } = useFormContext<TradingAllFormProps>();

    return (
        <NumberInput
            isClean
            flex="1"
            name={name}
            placeholder={TRADING_AMOUNT_PLACEHOLDER}
            style={tradingAmountInputStyle}
            locale={locale}
            control={control}
            rightContent={isBusy ? <Spinner size={20} /> : undefined}
        />
    );
};
