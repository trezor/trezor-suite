import { Account } from '../Account';
import { Alice } from '../Alice';
import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';
import { CoinjoinPrison } from '../CoinjoinPrison';
import * as middleware from '../middleware';
import { RoundPhase, Round } from '../coordinator';
import { ROUND_SELECTION_REGISTRATION_OFFSET } from '../../constants';

export type CoinjoinRoundGenerator = (
    ...args: ConstructorParameters<typeof CoinjoinRound>
) => CoinjoinRound;

export type AliceGenerator = (...args: ConstructorParameters<typeof Alice>) => Alice;

// Basic preselect CoinjoinRound candidates
// reuse existing CoinjoinRounds or create new one
export const getRoundCandidates = (
    generator: CoinjoinRoundGenerator,
    statusRounds: Round[],
    currentRounds: CoinjoinRound[],
    options: CoinjoinRoundOptions,
) => {
    const now = Date.now();
    return statusRounds
        .filter(
            round =>
                round.phase === RoundPhase.InputRegistration &&
                new Date(round.inputRegistrationEnd).getTime() - now >
                    ROUND_SELECTION_REGISTRATION_OFFSET,
        )
        .flatMap(round => {
            const current = currentRounds.find(r => r.id === round.id);
            if (current) return current;
            // try to create new CoinjoinRound
            try {
                return generator(round, options);
            } catch (e) {
                // constructor fails on invalid round data (highly unlikely)
                return [];
            }
        });
};

// Basic preselect Accounts
// exclude Account.utxos which are registered in CoinjoinRounds or detained in CoinjoinPrison
export const getAccountCandidates = (
    accounts: Account[],
    _statusRounds: Round[],
    currentRounds: CoinjoinRound[],
    prison: CoinjoinPrison,
    { log }: CoinjoinRoundOptions,
) => {
    // TODO: walk thru all Round[] and search in round events for account input/output scriptPubKey which are not supposed to be there (interrupted round)
    // if they are in phase 0 put them to prison to cool off so they registration on coordinator will timeout naturally, otherwise prison for longer, they will be banned

    // collect outpoints of all currently registered inputs in CoinjoinRounds + inputs in prison
    const registeredOutpoints = currentRounds
        .flatMap(round => round.inputs.concat(round.failed).map(u => u.outpoint))
        .concat(prison.inmates.map(i => i.id));

    return accounts.flatMap(account => {
        // skip account registered to critical rounds
        const { accountKey } = account;
        const isAccountAlreadyRegistered = currentRounds.find(
            round =>
                round.phase !== RoundPhase.Ended &&
                round.inputs.find(input => input.accountKey === accountKey),
        );

        if (isAccountAlreadyRegistered) {
            log(`Skipping candidate ~~${accountKey}~~. Already registered to round`);
            return [];
        }

        // TODO: double-check account max signed rounds, should be done by suite tho

        // exclude account utxos which are unavailable
        const utxos = account.utxos.filter(utxo => !registeredOutpoints.includes(utxo.outpoint));
        if (utxos.length > 0) {
            if (account.skipRounds) {
                const [low, high] = account.skipRounds;
                // skip reached lower limit
                // or skip randomly (20% chance with [4, 5] settings)
                if (account.skipRoundCounter >= low || Math.random() > low / high) {
                    account.skipRoundCounter = 0;
                    log(`Random skip candidate ~~${accountKey}~~`);
                    return [];
                }
                account.skipRoundCounter++;
            }

            log(`Found account candidate ~~${accountKey}~~ with ${utxos.length} inputs`);
            return {
                ...account,
                utxos,
            };
        }

        log(
            `Skipping candidate ~~${accountKey}~~. Utxos ${utxos.length} of ${account.utxos.length}`,
        );
        return [];
    });
};

// Use middleware algorithm to process preselected CoinjoinRounds and Accounts
export const selectUtxoForRound = async (
    generator: AliceGenerator,
    roundCandidates: CoinjoinRound[],
    accountCandidates: ReturnType<typeof getAccountCandidates>,
    options: CoinjoinRoundOptions,
) => {
    // utxoSelection shape: array_of_rounds[ array_of_accounts[ array_of_useful_account_utxo_indexes[] ] ]
    // example for 2 roundCandidates with 3 accountCandidates: [ [ [], [], [0, 1, 2] ], [ [3], [], [0, 1, 2] ] ]
    // each account/utxo set needs to be calculated separately because of different targetAnonymity
    const utxoSelection = await Promise.all(
        // for each CoinjoinRound...
        roundCandidates.map(round => {
            // ...create set of parameters
            const { roundParameters } = round;
            const roundConstants = {
                miningFeeRate: roundParameters.miningFeeRate,
                coordinationFeeRate: roundParameters.coordinationFeeRate,
                allowedInputAmounts: roundParameters.allowedInputAmounts,
                allowedOutputAmounts: roundParameters.allowedOutputAmounts,
                allowedInputTypes: roundParameters.allowedInputScriptTypes,
            };
            return Promise.all(
                // ...and for each Account
                accountCandidates.map(account => {
                    // ...also create set of parameters (utxos)
                    const utxos = account.utxos.map(utxo => ({
                        outpoint: utxo.outpoint,
                        amount: utxo.amount,
                        scriptType: account.scriptType,
                        anonymitySet: utxo.anonymityLevel,
                    }));

                    // skip Round candidate if fees are greater than allowed by account
                    if (
                        roundParameters.miningFeeRate > account.maxFeePerKvbyte ||
                        roundParameters.coordinationFeeRate.rate > account.maxCoordinatorFeeRate
                    ) {
                        options.log(
                            `Skipping round ~~${round.id}~~ for ~~${account.accountKey}~~. Fees to high ${roundParameters.miningFeeRate} ${roundParameters.coordinationFeeRate.rate}`,
                        );
                        return [];
                    }

                    // TODO: check account maxMining rate vs round miningRate + maxCoordinator rate vs round coordinationFeeRate
                    // ...finally call CoinjoinRound + Account + Round combination on middleware
                    return middleware
                        .selectUtxoForRound(roundConstants, utxos, account.targetAnonymity, {
                            signal: options.signal,
                            baseUrl: options.middlewareUrl,
                        })
                        .then(indices => indices.filter(i => utxos[i])) // filter valid existing indices
                        .catch(() => [] as number[]); // return empty response on error, TODO: should we provide preselected rounds/account anyway?
                }),
            );
        }),
    );

    // find Round with maximum possible utxos
    const sumUtxosInRounds = utxoSelection.map(acc => acc.reduce((a, b) => a + b.length, 0));
    const maxUtxosInRound = Math.max(...sumUtxosInRounds);
    if (maxUtxosInRound < 1) {
        options.log('No results from selectUtxoForRound');
        return;
    }

    // get index of Round with maximum possble utxos
    const roundIndex = sumUtxosInRounds.findIndex(count => count === maxUtxosInRound);
    const selectedRound = roundCandidates[roundIndex];

    // setup new Round
    accountCandidates.forEach((account, accountIndex) => {
        // find utxos assigned to this Round and Account
        const utxoIndexes = utxoSelection[roundIndex][accountIndex];
        const selectedUtxos = utxoIndexes.map(utxoIndex => account.utxos[utxoIndex]);
        if (selectedUtxos.length > 0) {
            // create new Alice(s) and add it to CoinjoinRound
            selectedRound.inputs.push(
                ...selectedUtxos.map(utxo =>
                    generator(account.accountKey, account.scriptType, utxo),
                ),
            );
        }
    });

    return selectedRound;
};

export const selectRound = async (
    roundGenerator: CoinjoinRoundGenerator,
    aliceGenerator: AliceGenerator,
    accounts: Account[],
    statusRounds: Round[],
    currentRounds: CoinjoinRound[],
    prison: CoinjoinPrison,
    options: CoinjoinRoundOptions,
) => {
    const { log } = options;

    log('Looking for rounds');
    const roundCandidates = getRoundCandidates(
        roundGenerator,
        statusRounds,
        currentRounds,
        options,
    );
    if (roundCandidates.length < 1) {
        log('No suitable rounds');
        return;
    }

    log('Looking for accounts');
    const accountCandidates = getAccountCandidates(
        accounts,
        statusRounds,
        currentRounds,
        prison,
        options,
    );
    if (accountCandidates.length < 1) {
        log('No suitable accounts');
        return;
    }

    log(`Looking for utxos`);
    const newRound = await selectUtxoForRound(
        aliceGenerator,
        roundCandidates,
        accountCandidates,
        options,
    );
    if (!newRound) {
        log('No suitable utxos');
        return;
    }

    log(`Created new round ~~${newRound.id}~~ with ${newRound.inputs.length} inputs`);
    return newRound;
};
