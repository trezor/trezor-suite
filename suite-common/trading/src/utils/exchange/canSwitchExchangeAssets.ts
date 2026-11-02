import { type CryptoId } from 'invity-api';

type CanSwitchExchangeAssetsParams = {
    sendCryptoId: CryptoId | undefined;
    receiveCryptoId: CryptoId | undefined;
    sellCryptoIds: CryptoId[];
    buyCryptoIds: CryptoId[];
};

export const canSwitchExchangeAssets = ({
    sendCryptoId,
    receiveCryptoId,
    sellCryptoIds,
    buyCryptoIds,
}: CanSwitchExchangeAssetsParams) =>
    !!sendCryptoId &&
    !!receiveCryptoId &&
    sellCryptoIds.includes(receiveCryptoId) &&
    buyCryptoIds.includes(sendCryptoId);
