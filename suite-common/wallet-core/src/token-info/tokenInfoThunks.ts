import { createThunk } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { type TokenInfoRootState } from './tokenInfoTypes';

const TOKEN_INFO_MODULE = '@common/wallet-core/token-info';

type FetchTokenInfoParams = { symbol: NetworkSymbol; contract: TokenAddress };
type FetchTokenInfoPayload = {
    decimals: number;
    symbol: string;
    name: string;
    standard: string;
};

export const fetchTokenInfoThunk = createThunk<FetchTokenInfoPayload, FetchTokenInfoParams>(
    `${TOKEN_INFO_MODULE}/fetchTokenInfoThunk`,
    async ({ symbol, contract }, { fulfillWithValue, rejectWithValue }) => {
        const response = await TrezorConnect.blockchainGetContractInfo({
            coin: symbol,
            contract,
        });

        if (!response.success) {
            // Failure is Err<SerializedError>: the error is on response.error, not payload.
            return rejectWithValue(response.error.message);
        }

        const { decimals, symbol: tokenSymbol, name, standard } = response.payload;

        return fulfillWithValue({ decimals, symbol: tokenSymbol, name, standard });
    },
    {
        // Dedupe: fetch only when untried or the previous fetch failed (manual retry).
        // An entry with no decimals and no error means a fetch is already in flight.
        condition: ({ symbol, contract }, { getState }) => {
            const state = getState() as TokenInfoRootState;
            const entry = state.wallet.tokenInfo[symbol]?.[contract.toLowerCase() as TokenAddress];

            return !entry || entry.error;
        },
    },
);
