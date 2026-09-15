import {
    type NetworkSymbol,
    getNetwork,
    getNetworkDisplaySymbol,
    getNetworkDisplaySymbolName,
    getNetworkOptional,
} from '@suite-common/wallet-config';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

/**
 * What a wallet holds of one asset on one network, added up over the accounts it has there.
 *
 * A wallet can have several accounts on a network — and several of them can hold the same token —
 * but the asset-first table shows one line per asset and network, so the accounts are one holding.
 */
export type AssetHolding = {
    cryptoBalance: BigNumber;
    /**
     * The token as the first account holding it described it — its name, symbol and decimals. Not
     * present for a network's own coin, which the network config describes instead.
     */
    tokenInfo: TokenInfo | undefined;
};

const findToken = (account: Account, contractAddress: TokenAddress) =>
    // Matched exactly, the way the index keyed it and the way fiat rates are keyed: the app passes
    // a contract around as the backend spelled it rather than normalizing it.
    account.tokens?.find(token => token.contract === contractAddress);

export const getAssetHolding = (
    accounts: readonly Account[],
    contractAddress?: TokenAddress,
): AssetHolding => {
    if (contractAddress === undefined) {
        return {
            cryptoBalance: accounts.reduce(
                (total, account) => total.plus(account.formattedBalance),
                new BigNumber(0),
            ),
            tokenInfo: undefined,
        };
    }

    return accounts.reduce<AssetHolding>(
        (holding, account) => {
            const token = findToken(account, contractAddress);

            if (!token) {
                return holding;
            }

            return {
                cryptoBalance: holding.cryptoBalance.plus(token.balance ?? '0'),
                tokenInfo: holding.tokenInfo ?? token,
            };
        },
        { cryptoBalance: new BigNumber(0), tokenInfo: undefined },
    );
};

export const getAssetFiatValue = (cryptoBalance: BigNumber, rate: number | undefined) =>
    rate === undefined ? undefined : cryptoBalance.multipliedBy(rate);

/**
 * What the asset is, across the networks it lives on: ETH held on Arbitrum is the same asset as ETH
 * held on Ethereum, and a table that puts them next to each other needs to say so.
 */
export const getAssetDisplaySymbol = ({
    symbol,
    tokenInfo,
}: {
    symbol: NetworkSymbol;
    tokenInfo: TokenInfo | undefined;
}) => tokenInfo?.symbol?.toUpperCase() ?? getNetworkDisplaySymbol(symbol);

/**
 * The asset's name, not the name of the network it is held on.
 *
 * For a coin that is the network which issues it — `arb`'s coin is Ethereum's ETH, so the row says
 * Ethereum, with Arbitrum One as the network beside it.
 */
export const getAssetName = ({
    symbol,
    tokenInfo,
}: {
    symbol: NetworkSymbol;
    tokenInfo: TokenInfo | undefined;
}) => {
    if (tokenInfo) {
        return tokenInfo.name ?? tokenInfo.symbol ?? '';
    }

    const issuingNetwork = getNetworkOptional(getNetworkDisplaySymbol(symbol).toLowerCase());

    return issuingNetwork?.name ?? getNetworkDisplaySymbolName(symbol);
};

export const getNetworkName = (symbol: NetworkSymbol) => getNetwork(symbol).name;
