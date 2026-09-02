import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';

export const PORTFOLIO_GRAPH_INSTANCE_ID = 'portfolio';

export type PortfolioGraphInstanceId = typeof PORTFOLIO_GRAPH_INSTANCE_ID;
export type AccountGraphInstanceId =
    `account:${AccountKey}` | `account:${AccountKey}:token:${TokenAddress}`;
export type GraphInstanceId = PortfolioGraphInstanceId | AccountGraphInstanceId;

type GetAccountGraphInstanceIdParams = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const getPortfolioGraphInstanceId = (): PortfolioGraphInstanceId =>
    PORTFOLIO_GRAPH_INSTANCE_ID;

export const isPortfolioGraphInstanceId = (
    instanceId: GraphInstanceId,
): instanceId is PortfolioGraphInstanceId => instanceId === PORTFOLIO_GRAPH_INSTANCE_ID;

export const getAccountGraphInstanceId = ({
    accountKey,
    tokenContract,
}: GetAccountGraphInstanceIdParams): AccountGraphInstanceId => {
    if (tokenContract) {
        return `account:${accountKey}:token:${tokenContract}`;
    }

    return `account:${accountKey}`;
};
