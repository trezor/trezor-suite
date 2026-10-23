import { type CryptoId } from 'invity-api';

import { type AddressValidator } from '@suite-common/networks';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';

import { type TradingRootState } from '../../reducers/tradingCommonReducer';
import { selectTradingExchangeReceiveAccountKey } from '../../selectors/tradingSelectors';
import { isReceiveAddressCoherent } from '../../utils/exchange/receiveAddressCoherence';

export const RECEIVE_ADDRESS_NETWORK_MISMATCH_ERROR =
    'Receive address does not match the receive network';

type IsExchangeReceiveAddressCoherentProps = {
    state: TradingRootState & AccountsRootState;
    addressValidator: AddressValidator;
    receiveAddress: string | undefined;
    receiveCryptoId: CryptoId | undefined;
};

export const isExchangeReceiveAddressCoherent = ({
    state,
    addressValidator,
    receiveAddress,
    receiveCryptoId,
}: IsExchangeReceiveAddressCoherentProps): boolean => {
    const receiveAccountKey = selectTradingExchangeReceiveAccountKey(state);

    return isReceiveAddressCoherent({
        addressValidator,
        receiveAddress,
        receiveCryptoId,
        receiveAccountKey,
        receiveAccountSymbol: selectAccountByKey(state, receiveAccountKey)?.symbol,
    });
};
