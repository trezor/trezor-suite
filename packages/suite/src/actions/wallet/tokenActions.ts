import { TOKEN } from '@wallet-actions/constants';

import { GetState, Dispatch } from '@suite-types/index';
import { NetworkToken, Token, Account } from '@wallet-types/index';
import { State } from '@wallet-reducers/tokenReducer';
import * as BlockchainActions from '@wallet-actions/ethereum/blockchainActions';

export type TokenAction =
    | {
          type: typeof TOKEN.FROM_STORAGE;
          payload: State;
      }
    | {
          type: typeof TOKEN.ADD;
          payload: Token;
      }
    | {
          type: typeof TOKEN.REMOVE;
          token: Token;
      }
    | {
          type: typeof TOKEN.SET_BALANCE;
          payload: State;
      };

// action from component <reactSelect>
export const load = (input: string, network: string) => async (
    dispatch: Dispatch,
    getState: GetState,
): Promise<any> => {
    let formattedInput = input;
    if (formattedInput.length < 1) formattedInput = '0x';

    const tokens = getState().wallet.localStorage.tokens[network];
    const value = formattedInput.toLowerCase();
    const result = tokens.filter(
        t =>
            t.symbol.toLowerCase().indexOf(value) >= 0 ||
            t.address.toLowerCase().indexOf(value) >= 0 ||
            t.name.toLowerCase().indexOf(value) >= 0,
    );

    if (result.length > 0) {
        return result;
    }

    const info = await dispatch(BlockchainActions.getTokenInfo(formattedInput, network));
    if (info) {
        return [info];
    }

    return null;
};

export const setBalance = (tokenAddress: string, ethAddress: string, balance: string) => async (
    dispatch: Dispatch,
    getState: GetState,
): Promise<void> => {
    const newState: Token[] = [...getState().wallet.tokens];
    const token = newState.find(t => t.address === tokenAddress && t.ethAddress === ethAddress);
    if (token) {
        const others = newState.filter(t => t !== token);
        dispatch({
            type: TOKEN.SET_BALANCE,
            payload: others.concat([
                {
                    ...token,
                    loaded: true,
                    balance,
                },
            ]),
        });
    }
};

export const add = (token: NetworkToken, account: Account) => async (
    dispatch: Dispatch,
): Promise<void> => {
    console.log('add');
    const tkn: Token = {
        loaded: false,
        deviceState: account.deviceState,
        network: account.network,
        name: token.name,
        symbol: token.symbol,
        address: token.address,
        ethAddress: account.descriptor,
        decimals: token.decimals,
        balance: '0',
    };

    dispatch({
        type: TOKEN.ADD,
        payload: tkn,
    });

    const tokenBalance = await dispatch(BlockchainActions.getTokenBalance(tkn));
    dispatch(setBalance(token.address, account.descriptor, tokenBalance));
};

export const remove = (token: Token) => ({
    type: TOKEN.REMOVE,
    token,
});
