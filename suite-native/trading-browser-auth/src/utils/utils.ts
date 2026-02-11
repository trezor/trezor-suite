import { TRADING_URL_DEFAULT_BACK } from '../consts';

export const doesUrlContainCloseCallbackUrl = (
    url: string,
    closeCallbackUrl: string = TRADING_URL_DEFAULT_BACK,
) => url.includes(closeCallbackUrl);
