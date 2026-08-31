import { useFormContext } from 'react-hook-form';

import { selectLanguage } from '@suite/settings';
import { useSelector } from '@suite-common/redux-utils';
import { selectTradingLoadingAndTimestamp } from '@suite-common/trading';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Spinner } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';

import {
    type TradingAllFormProps,
    type TradingFormInputFiatCryptoProps,
} from 'src/types/trading/tradingForm';

type TradingFormInputAmountPlaceholderProps = Pick<
    TradingFormInputFiatCryptoProps,
    'labelLeft' | 'labelRight'
> & {
    name: TradingFormInputFiatCryptoProps['cryptoInputName' | 'fiatInputName'];
};

export const TradingFormInputAmountPlaceholder = ({
    name,
    labelLeft,
    labelRight,
}: TradingFormInputAmountPlaceholderProps) => {
    const locale = useSelector(selectLanguage);
    const { isLoading } = useSelector(selectTradingLoadingAndTimestamp);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const isBusy = isLoading || isDiscoveryRunning;
    const { control } = useFormContext<TradingAllFormProps>();

    return (
        <NumberInput
            name={name}
            locale={locale}
            labelLeft={labelLeft}
            labelRight={labelRight}
            control={control}
            rightContent={isBusy ? <Spinner size={20} /> : undefined}
        />
    );
};
