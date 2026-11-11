import { useFormContext } from 'react-hook-form';

import { selectLanguage } from '@suite/settings';
import { TRADING_SECTION_CATALOGS, useTradingCatalogStatus } from '@suite-common/trading';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Spinner } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';

import { useSelector } from '#src/hooks/suite/useSelector';
import { useTradingFormContext } from '#src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    type TradingAllFormProps,
    type TradingFormInputFiatCryptoProps,
} from '#src/types/trading/tradingForm';
import {
    TRADING_AMOUNT_PLACEHOLDER,
    getTradingAmountInputStyle,
} from '#src/views/wallet/trading/common/TradingForm/tradingFormInputsUtils';

type TradingFormInputAmountPlaceholderProps = {
    name: TradingFormInputFiatCryptoProps['cryptoInputName' | 'fiatInputName'];
};

export const TradingFormInputAmountPlaceholder = ({
    name,
}: TradingFormInputAmountPlaceholderProps) => {
    const locale = useSelector(selectLanguage);
    const { type } = useTradingFormContext();
    const { isLoading } = useTradingCatalogStatus(TRADING_SECTION_CATALOGS[type]);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const isBusy = isLoading || isDiscoveryRunning;
    const { control } = useFormContext<TradingAllFormProps>();

    return (
        <NumberInput
            isClean
            placeholderColor="contentSecondary"
            flex="1"
            name={name}
            placeholder={TRADING_AMOUNT_PLACEHOLDER}
            style={getTradingAmountInputStyle}
            locale={locale}
            control={control}
            rightContent={isBusy ? <Spinner size={20} /> : undefined}
        />
    );
};
