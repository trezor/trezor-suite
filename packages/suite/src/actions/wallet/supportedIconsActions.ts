import { SUPPORTED_ICONS } from '@wallet-actions/constants';
import { Dispatch } from '@suite-types';

export type SupportedIconsActions = {
    type: typeof SUPPORTED_ICONS.INIT;
    tokenList: string[] | null;
};

export const init = () => async (dispatch: Dispatch) => {
    const listUrl =
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/whitelist.json';

    fetch(listUrl)
        .then(response => {
            if (response.status !== 200) {
                dispatch({
                    type: SUPPORTED_ICONS.INIT,
                    tokenList: null,
                });
            }
            return response.json();
        })
        .then((data: string[]) =>
            dispatch({
                type: SUPPORTED_ICONS.INIT,
                tokenList: data,
            }),
        );
};
