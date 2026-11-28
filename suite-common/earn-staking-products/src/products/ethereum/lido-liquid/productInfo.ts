import {
    type FetchProductInfoParams,
    type StakingAmount,
    type StakingProductInfo,
    stakingProductInfoSchema,
} from '@suite-common/earn-staking-common';
import type { GetTrezorBlockchainDep } from '@trezor/blockchain-core';
import { asCoinSymbol } from '@trezor/connect-common';
import { LidoContractReads, type LidoDeployment } from '@trezor/network-ethereum-suite-common';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { scheduleAction } from '@trezor/utils';
import { z } from '@trezor/zod';

import { toStakingAmount } from '../../../utils/stakingAmounts';

const DAY_MS = 24 * 60 * 60 * 1000;

// TODO: Take the rate from the Dune data once it is served, and serve the queue time through the
// staking API of earn.trezor.io before a release, as the other products are served.
const LIDO_APR_URL = 'https://eth-api.lido.fi/v1/protocol/steth/apr/sma';
const LIDO_WITHDRAWAL_TIME_URL = 'https://wq-api.lido.fi/v2/request-time/calculate';

// The rate and the queue time only inform: an API that hangs must not hold back the wstETH value
// the flows cannot do without, so its request is given up on and its figure shown as unknown.
export const LIDO_API_TIMEOUT_MS = 5000;

// The staking oracle reports once a day, which is when wstETH gains its value.
const REWARD_PERIOD_DAYS = 1;

// A read needs a sender; the wstETH contract does not care which.
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// The seven-day average APR of stETH.
const lidoAprResponseSchema = z.object({
    data: z.object({ smaApr: z.number().nonnegative() }),
});

const lidoWithdrawalTimeResponseSchema = z.object({
    requestInfo: z.object({ finalizationIn: z.number().nonnegative() }),
});

export type FetchLidoApi = (url: string, init?: RequestInit) => Promise<Response>;

export type EthereumLidoLiquidProductInfoDeps = GetTrezorBlockchainDep<'evmRpcCall'> & {
    fetch: FetchLidoApi;
};

export type FetchEthereumLidoLiquidProductInfoParams = FetchProductInfoParams & {
    networkSymbol: NetworkSymbol;
    deployment: LidoDeployment;
};

const fetchLidoApi = async (
    deps: EthereumLidoLiquidProductInfoDeps,
    url: string,
    abortSignal: AbortSignal | undefined,
): Promise<unknown> => {
    const response = await scheduleAction(signal => deps.fetch(url, { signal }), {
        timeout: LIDO_API_TIMEOUT_MS,
        signal: abortSignal,
    });

    if (!response.ok) {
        throw new Error(`Lido API responded with ${response.status}`);
    }

    return response.json();
};

const fetchLidoApr = async (
    deps: EthereumLidoLiquidProductInfoDeps,
    abortSignal: AbortSignal | undefined,
): Promise<number> => {
    const { data } = lidoAprResponseSchema.parse(
        await fetchLidoApi(deps, LIDO_APR_URL, abortSignal),
    );

    return data.smaApr;
};

const fetchLidoWithdrawalDays = async (
    deps: EthereumLidoLiquidProductInfoDeps,
    abortSignal: AbortSignal | undefined,
): Promise<number> => {
    const { requestInfo } = lidoWithdrawalTimeResponseSchema.parse(
        await fetchLidoApi(deps, LIDO_WITHDRAWAL_TIME_URL, abortSignal),
    );

    return requestInfo.finalizationIn / DAY_MS;
};

const fetchWstETHValue = async (
    deps: EthereumLidoLiquidProductInfoDeps,
    { networkSymbol, deployment }: FetchEthereumLidoLiquidProductInfoParams,
): Promise<StakingAmount> => {
    const response = await deps.getTrezorBlockchain().evmRpcCall({
        coin: asCoinSymbol(networkSymbol),
        from: ZERO_ADDRESS,
        to: deployment.wstETH,
        data: LidoContractReads.stEthPerToken.encode(),
    });

    if (!response.success) {
        throw new Error(`Reading the wstETH value failed: ${response.error.message}`);
    }

    return toStakingAmount(
        LidoContractReads.stEthPerToken.decode(response.payload.data).toString(),
    );
};

export const fetchEthereumLidoLiquidProductInfo = async (
    deps: EthereumLidoLiquidProductInfoDeps,
    params: FetchEthereumLidoLiquidProductInfoParams,
): Promise<StakingProductInfo> => {
    // The position is worth nothing without the wstETH value, so only that request may fail the
    // whole info; the rate and the queue time are shown as unknown.
    const [liquidTokenValue, rate, exitPeriodDays] = await Promise.all([
        fetchWstETHValue(deps, params),
        fetchLidoApr(deps, params.abortSignal).catch(() => null),
        fetchLidoWithdrawalDays(deps, params.abortSignal).catch(() => null),
    ]);

    return stakingProductInfoSchema.parse({
        rate,
        // The stake returns wstETH in the same transaction.
        entryPeriodDays: 0,
        exitPeriodDays,
        rewardPeriodDays: REWARD_PERIOD_DAYS,
        nextRewardAt: null,
        liquidTokenValue,
        targets: [],
    });
};
