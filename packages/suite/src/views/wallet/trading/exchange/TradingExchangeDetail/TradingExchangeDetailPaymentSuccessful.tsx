import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { Button } from '@trezor/components';
import { CheckIcon } from '@trezor/icons';

import { TradingDetailTerminalState } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalState';

export const TradingExchangeDetailPaymentSuccessful = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(gotoThunk({ routeName: 'wallet-trading-exchange' }));

    return (
        <TradingDetailTerminalState
            icon={CheckIcon}
            title={<Translation id="TR_EXCHANGE_DETAIL_SUCCESS_TITLE" />}
            description={<Translation id="TR_EXCHANGE_DETAIL_SUCCESS_TEXT" />}
            action={
                <Button onClick={handleClick}>
                    <Translation id="TR_EXCHANGE_DETAIL_SUCCESS_BUTTON" />
                </Button>
            }
        />
    );
};
