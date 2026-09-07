import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { Button } from '@trezor/components';
import { XIcon } from '@trezor/icons';

import { TradingDetailTerminalState } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalState';

export const TradingExchangeDetailPaymentFailed = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(gotoThunk({ routeName: 'wallet-trading-exchange' }));

    return (
        <TradingDetailTerminalState
            icon={XIcon}
            intent="critical"
            title={<Translation id="TR_EXCHANGE_DETAIL_ERROR_TITLE" />}
            description={<Translation id="TR_EXCHANGE_DETAIL_ERROR_TEXT" />}
            action={
                <Button onClick={handleClick} intent="neutral" priority="secondary">
                    <Translation id="TR_EXCHANGE_DETAIL_ERROR_BUTTON" />
                </Button>
            }
        />
    );
};
