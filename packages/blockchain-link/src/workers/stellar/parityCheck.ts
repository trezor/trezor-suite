/* eslint-disable no-console -- a diagnostic script whose output is the point. */
import * as utils from '@trezor/blockchain-link-utils/src/stellar';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
    createStellarDataSource,
    getStellarConnection,
    parseClassicAssetContract,
    readAccountState,
} from '@trezor/network-stellar';
import { toStroops } from '@trezor/network-stellar/constants';
import type { StellarAssetRef, StellarHorizonServer } from '@trezor/network-stellar/types';
import { BigNumber } from '@trezor/utils';

/**
 * Compares the account state Suite derives over Stellar RPC against the one Horizon reports, for
 * real descriptors on the same origin. This is the check that validated the migration; keeping it
 * runnable turns it from a one-off into something that can be re-run against new accounts.
 *
 *   yarn workspace @trezor/blockchain-link stellar:parity <descriptor> [<descriptor> …]
 *
 * Include an account with non-curated trustlines to quantify the allow-list regression: the
 * summary reports which trustlines an RPC-only discovery would not have found.
 */

const DEFAULT_URL = process.env.STELLAR_URL ?? 'http://dev-xlm.suite.sldev.cz';

interface AccountFields {
    balance: string;
    availableBalance: string;
    sequence: string;
    reserve: string;
    baseReserve: string;
    tokens: Record<string, string>;
}

const availableBalance = ({
    balance,
    reserve,
    sellingLiabilities,
    baseReserve,
    numSponsoring,
    numSponsored,
}: {
    balance: BigNumber;
    reserve: BigNumber;
    sellingLiabilities: BigNumber;
    baseReserve: BigNumber;
    numSponsoring: number;
    numSponsored: number;
}) =>
    balance
        .minus(reserve)
        .minus(sellingLiabilities)
        .minus(baseReserve.times(numSponsoring))
        .plus(baseReserve.times(numSponsored))
        .toString();

const readViaHorizon = async (
    horizon: StellarHorizonServer,
    descriptor: string,
    baseReserve: BigNumber,
): Promise<AccountFields> => {
    const info = await horizon.accounts().accountId(descriptor).call();
    const native = info.balances.find(entry => entry.asset_type === 'native');
    const reserve = baseReserve.times(2 + info.subentry_count);

    return {
        balance: toStroops(native?.balance ?? '0').toString(),
        availableBalance: availableBalance({
            balance: toStroops(native?.balance ?? '0'),
            reserve,
            sellingLiabilities: toStroops(native?.selling_liabilities ?? '0'),
            baseReserve,
            numSponsoring: info.num_sponsoring,
            numSponsored: info.num_sponsored,
        }),
        sequence: info.sequence,
        reserve: reserve.toString(),
        baseReserve: baseReserve.toString(),
        tokens: Object.fromEntries(
            info.balances
                .filter(
                    entry =>
                        entry.asset_type === 'credit_alphanum4' ||
                        entry.asset_type === 'credit_alphanum12',
                )
                .map(entry => [
                    `${entry.asset_code}-${entry.asset_issuer}`,
                    toStroops(entry.balance).toString(),
                ]),
        ),
    };
};

const toFields = (
    state: Awaited<ReturnType<ReturnType<typeof createStellarDataSource>['readAccountState']>>,
    baseReserve: BigNumber,
): AccountFields => {
    const reserve = baseReserve.times(2 + state.numSubEntries);

    return {
        balance: state.balance,
        availableBalance: availableBalance({
            balance: new BigNumber(state.balance),
            reserve,
            sellingLiabilities: new BigNumber(state.sellingLiabilities),
            baseReserve,
            numSponsoring: state.numSponsoring,
            numSponsored: state.numSponsored,
        }),
        sequence: state.sequence,
        reserve: reserve.toString(),
        baseReserve: baseReserve.toString(),
        tokens: Object.fromEntries(
            state.trustlines.map(({ assetCode, assetIssuer, balance }) => [
                `${assetCode}-${assetIssuer}`,
                balance,
            ]),
        ),
    };
};

const compare = (horizon: AccountFields, rpc: AccountFields) => {
    const scalars = ['balance', 'availableBalance', 'sequence', 'reserve', 'baseReserve'] as const;
    const mismatches = scalars.flatMap(field =>
        horizon[field] === rpc[field]
            ? []
            : [`${field}: horizon=${horizon[field]} rpc=${rpc[field]}`],
    );

    const contracts = [...new Set([...Object.keys(horizon.tokens), ...Object.keys(rpc.tokens)])];
    const tokenMismatches = contracts.flatMap(contract =>
        horizon.tokens[contract] === rpc.tokens[contract]
            ? []
            : [
                  `token ${contract}: horizon=${horizon.tokens[contract] ?? '<absent>'} rpc=${
                      rpc.tokens[contract] ?? '<absent>'
                  }`,
              ],
    );

    return [...mismatches, ...tokenMismatches];
};

const run = async () => {
    const descriptors = process.argv.slice(2);

    if (descriptors.length === 0) {
        console.error('usage: stellar:parity <descriptor> [<descriptor> …]');
        process.exit(2);
    }

    const api = await getStellarConnection(DEFAULT_URL);
    const dataSource = createStellarDataSource(api);
    const { baseReserve } = await dataSource.readLatestLedger();
    const definitions = await utils.getTokenMetadata().catch(() => ({}));
    const curatedAssets: StellarAssetRef[] = Object.keys(definitions).flatMap(
        contract => parseClassicAssetContract(contract) ?? [],
    );

    console.log(`origin ${DEFAULT_URL}, base reserve ${baseReserve}`);
    console.log(`definitions list: ${curatedAssets.length} classic assets\n`);

    let failed = false;

    for (const descriptor of descriptors) {
        const [horizonFields, state, curatedOnly] = await Promise.all([
            readViaHorizon(api.horizon, descriptor, new BigNumber(baseReserve)),
            dataSource.readAccountState({ descriptor, knownAssets: curatedAssets }),
            readAccountState({ server: api.rpc, descriptor, assets: curatedAssets }),
        ]);

        const mismatches = compare(horizonFields, toFields(state, new BigNumber(baseReserve)));
        const invisible = Object.keys(horizonFields.tokens).filter(
            contract =>
                !curatedOnly.trustlines.some(
                    ({ assetCode, assetIssuer }) => `${assetCode}-${assetIssuer}` === contract,
                ),
        );

        console.log(`${descriptor}`);
        console.log(`  fields: ${mismatches.length === 0 ? 'match' : 'MISMATCH'}`);
        mismatches.forEach(mismatch => console.log(`    ${mismatch}`));
        console.log(
            `  trustlines: ${Object.keys(horizonFields.tokens).length} on Horizon, ` +
                `${invisible.length} invisible to an RPC-only allow-list`,
        );
        invisible.forEach(contract => console.log(`    missed ${contract}`));
        console.log('');

        failed = failed || mismatches.length > 0;
    }

    process.exit(failed ? 1 : 0);
};

run();
