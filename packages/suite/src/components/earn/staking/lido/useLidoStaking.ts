import { selectStakingPosition, useStakingProductInfo } from '@suite-common/earn-staking';
import {
    type StakingPosition,
    type StakingProductId,
    getStakingProductId,
    stakingProviderIdSchema,
} from '@suite-common/earn-staking-common';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { type LidoDeployment, getLidoDeployment } from '@trezor/network-ethereum-suite-common';
import { BigNumber } from '@trezor/utils';

import { useSelector } from '#src/hooks/suite/useSelector';

const LIDO_PROVIDER_ID = stakingProviderIdSchema.parse('lido');

const WSTETH_DECIMALS = 18;

export const getLidoProductId = (networkSymbol: NetworkSymbol): StakingProductId =>
    getStakingProductId({
        networkSymbol,
        asset: { kind: 'native' },
        providerId: LIDO_PROVIDER_ID,
        type: 'liquid',
    });

export type LidoStaking = {
    deployment: LidoDeployment | null;
    productId: StakingProductId;
    position: StakingPosition | null;
    wstETHToken: YieldFlowDisplayToken | null;
    // In wei.
    wstETHBalance: string;
    // What one whole wstETH is worth in wei of ETH; null until the product info is fetched.
    wstETHValue: string | null;
    rate: number | null;
    withdrawalDays: number | null;
};

export const useLidoStaking = (account: Account): LidoStaking => {
    const deployment = getLidoDeployment(account.symbol);
    const productId = getLidoProductId(account.symbol);

    const position = useSelector(state => selectStakingPosition(state, account.key, productId));
    const { productInfo } = useStakingProductInfo(productId);

    // Read from the account's tokens, not from the position: the position needs the wstETH value
    // from the product info, and the balance must show even while that value is missing.
    const wstETHAccountToken = account.tokens?.find(
        ({ contract }) => contract.toLowerCase() === deployment?.wstETH,
    );
    const wstETHBalance = new BigNumber(wstETHAccountToken?.balance ?? 0)
        .shiftedBy(WSTETH_DECIMALS)
        .toFixed(0);

    const wstETHToken: YieldFlowDisplayToken | null = deployment
        ? {
              networkSymbol: account.symbol,
              symbol: 'wstETH',
              decimals: WSTETH_DECIMALS,
              contractAddress: deployment.wstETH,
          }
        : null;

    return {
        deployment,
        productId,
        position,
        wstETHToken,
        wstETHBalance,
        wstETHValue: productInfo?.liquidTokenValue ?? null,
        rate: productInfo?.rate ?? null,
        withdrawalDays: productInfo?.exitPeriodDays ?? null,
    };
};
