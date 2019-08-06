import { NetworkToken, Token } from '@wallet-types';
import { Dispatch } from '@suite-types';

// TODO

export const getTokenInfo = (_input: string, _network: string) => async (
    _dispatch: Dispatch,
): Promise<NetworkToken> => {
    // dispatch(Web3Actions.getTokenInfo(input, network));
    return {
        address: 'addr',
        name: 'name',
        symbol: 'symbol',
        decimals: 6,
    };
};

export const getTokenBalance = (_token: Token) => async (_dispatch: Dispatch) => {
    // dispatch(Web3Actions.getTokenBalance(token));
    return '0';
};
