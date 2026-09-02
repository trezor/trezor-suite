import { useSelector } from 'react-redux';

import type { CryptoId } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import { type TradingRootState, selectTradingCoinSymbolByCryptoId } from '@suite-common/trading';
import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type LimitPickerUnlimitedAlertProps = {
    cryptoId: CryptoId | undefined;
};

export const LimitPickerUnlimitedAlert = ({ cryptoId }: LimitPickerUnlimitedAlertProps) => {
    const coinSymbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, cryptoId),
    );

    invariant(coinSymbol, 'Unknown cryptoId provided to LimitPickerUnlimitedAlert');

    return (
        <BannerInline
            title={
                <Translation
                    id="moduleTrading.exchangeApprovalLimitSheet.unlimitedCard.alert"
                    values={{ coinSymbol }}
                />
            }
            intent="warning"
        />
    );
};
