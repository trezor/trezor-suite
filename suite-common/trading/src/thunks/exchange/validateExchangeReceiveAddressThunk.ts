import { type CryptoId } from 'invity-api';

import { type AddressValidatorDep, injectAddressValidator } from '@suite-common/networks';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { isReceiveAddressCoherent } from '../../utils/exchange/receiveAddressCoherence';
import { logErrorThunk } from '../common/logErrorThunk';

export type ValidateExchangeReceiveAddressThunkProps = {
    receiveAddress: string | undefined;
    receiveCryptoId: CryptoId | undefined;
};

export type ValidateExchangeReceiveAddressThunkDeps = WithServices<{
    networks: AddressValidatorDep;
}>;

export const validateExchangeReceiveAddressThunk = createThunk<
    boolean,
    ValidateExchangeReceiveAddressThunkProps,
    { extra: ValidateExchangeReceiveAddressThunkDeps }
>(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/validateReceiveAddress`,
    ({ receiveAddress, receiveCryptoId }, { dispatch, extra }) => {
        const isReceiveAddressAccepted = isReceiveAddressCoherent({
            addressValidator: injectAddressValidator(extra.services).addressValidator,
            receiveAddress,
            receiveCryptoId,
        });

        if (!isReceiveAddressAccepted) {
            dispatch(
                logErrorThunk({
                    errorMessage: 'Receive address does not match the receive network',
                    tradingType: 'exchange',
                }),
            );
        }

        return isReceiveAddressAccepted;
    },
);
