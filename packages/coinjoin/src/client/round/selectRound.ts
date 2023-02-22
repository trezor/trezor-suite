import { arrayPartition, arrayToDictionary } from '@trezor/utils';

import { Account } from '../Account';
import { Alice } from '../Alice';
import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';
import { CoinjoinPrison } from '../CoinjoinPrison';
import * as middleware from '../middleware';
import { Round } from '../coordinator';
import { ROUND_SELECTION_REGISTRATION_OFFSET } from '../../constants';
import { RoundPhase, SessionPhase } from '../../enums';

export type CoinjoinRoundGenerator = (
    ...args: ConstructorParameters<typeof CoinjoinRound>
) => CoinjoinRound;

export type AliceGenerator = (...args: ConstructorParameters<typeof Alice>) => Alice;

export interface SelectRoundProps {
    roundGenerator: CoinjoinRoundGenerator;
    aliceGenerator: AliceGenerator;
    accounts: Account[];
    statusRounds: Round[];
    coinjoinRounds: CoinjoinRound[];
    prison: CoinjoinPrison;
    options: CoinjoinRoundOptions;
    runningAffiliateServer: boolean;
}

// Basic preselect CoinjoinRound candidates
// reuse existing CoinjoinRounds or create new one
export const getRoundCandidates = ({
    roundGenerator,
    statusRounds,
    coinjoinRounds,
    options,
    prison,
}: Omit<SelectRoundProps, 'aliceGenerator' | 'accounts' | 'runningAffiliateServer'>) => {
    const now = Date.now();
    return statusRounds
        .filter(
            round =>
                round.phase === RoundPhase.InputRegistration &&
                new Date(round.inputRegistrationEnd).getTime() - now >
                    ROUND_SELECTION_REGISTRATION_OFFSET,
        )
        .flatMap(round => {
            const current = coinjoinRounds.find(r => r.id === round.id);
            if (current) return current;
            // try to create new CoinjoinRound
            try {
                return roundGenerator(round, prison, options);
            } catch (e) {
                // constructor fails on invalid round data (highly unlikely)
                return [];
            }
        });
};

export const getUnregisteredAccounts = ({
    accounts,
    coinjoinRounds,
    options: { logger },
}: Pick<SelectRoundProps, 'accounts' | 'coinjoinRounds' | 'options'>) =>
    accounts.filter(({ accountKey }) => {
        const isAlreadyRegistered = coinjoinRounds.find(
            round =>
                round.phase !== RoundPhase.Ended &&
                round.inputs.find(input => input.accountKey === accountKey),
        );

        if (isAlreadyRegistered) {
            logger.log(`Skipping candidate ~~${accountKey}~~. Already registered to round`);
        }

        return !isAlreadyRegistered;
    });

// Basic preselect Accounts
// exclude Account.utxos which are registered in CoinjoinRounds or detained in CoinjoinPrison
export const getAccountCandidates = ({
    accounts,
    coinjoinRounds,
    prison,
    options: { logger, setSessionPhase },
}: Pick<SelectRoundProps, 'accounts' | 'coinjoinRounds' | 'prison' | 'options'>) => {
    // TODO: walk thru all Round[] and search in round events for account input/output scriptPubKey which are not supposed to be there (interrupted round)
    // if they are in phase 0 put them to prison to cool off so they registration on coordinator will timeout naturally, otherwise prison for longer, they will be banned

    // collect outpoints of all currently registered inputs in CoinjoinRounds + inputs in prison
    const registeredOutpoints = coinjoinRounds
        .flatMap(round => round.inputs.concat(round.failed).map(u => u.outpoint))
        .concat(prison.inmates.map(i => i.id));

    const blameOfInputs = prison.getBlameOfInmates();
    const skippedAccounts: Array<{ key: string; reason: SessionPhase }> = [];

    const candidates = accounts.flatMap(account => {
        // skip account registered to critical rounds
        const { accountKey } = account;
        // TODO: double-check account max signed rounds, should be done by suite tho

        // account was detained
        if (prison.isDetained(accountKey)) {
            logger.log(`Account ~~${accountKey}~~ detained`);
            return [];
        }

        const blameOfUtxos = arrayToDictionary(
            account.utxos,
            utxo => {
                const blamedUtxo = blameOfInputs.find(i => i.id === utxo.outpoint);
                return blamedUtxo?.roundId;
            },
            true,
        );

        if (Object.keys(blameOfUtxos).length > 0) {
            logger.log(`Found account candidate for blame round ~~${accountKey}~~`);
            return {
                ...account,
                blameOf: blameOfUtxos,
                utxos: [],
            };
        }

        // exclude account utxos which are unavailable
        const utxos = account.utxos.filter(utxo => !registeredOutpoints.includes(utxo.outpoint));
        if (utxos.length > 0) {
            if (account.skipRounds) {
                const [low, high] = account.skipRounds;
                // skip reached lower limit
                // or skip randomly (20% chance with [4, 5] settings)
                if (
                    account.skipRoundCounter >= low ||
                    (account.skipRoundCounter > 0 && Math.random() > low / high)
                ) {
                    account.skipRoundCounter = 0;
                    logger.log(`Random skip candidate ~~${accountKey}~~`);
                    skippedAccounts.push({
                        key: account.accountKey,
                        reason: SessionPhase.SkippingRound,
                    });

                    return [];
                }
                account.skipRoundCounter++;
            }

            logger.log(`Found account candidate ~~${accountKey}~~ with ${utxos.length} inputs`);
            return {
                ...account,
                blameOf: null,
                utxos,
            };
        }

        logger.log(
            `Skipping candidate ~~${accountKey}~~. Utxos ${utxos.length} of ${account.utxos.length}`,
        );
        skippedAccounts.push({
            key: account.accountKey,
            reason: SessionPhase.AccountMissingUtxos,
        });

        return [];
    });

    if (skippedAccounts.length) {
        const eventGroups = skippedAccounts.reduce((groups, { key, reason }) => {
            if (!groups[reason]) {
                groups[reason] = { phase: reason, accountKeys: [key] };
            } else {
                groups[reason].accountKeys.push(key);
            }

            return groups;
        }, {} as Record<SessionPhase, Parameters<typeof setSessionPhase>[0]>);

        Object.values(eventGroups).forEach(setSessionPhase);
    }

    return candidates;
};

interface SelectInputsForRoundProps extends Pick<SelectRoundProps, 'aliceGenerator' | 'options'> {
    roundCandidates: CoinjoinRound[];
    accountCandidates: ReturnType<typeof getAccountCandidates>;
}

const selectInputsForBlameRound = ({
    aliceGenerator,
    roundCandidates,
    accountCandidates,
    options: { logger },
}: SelectInputsForRoundProps) =>
    roundCandidates.find(round => {
        const inputs: CoinjoinRound['inputs'] = [];
        accountCandidates.forEach(account => {
            const utxos = account.blameOf ? account.blameOf[round.blameOf] : null;
            if (utxos && utxos.length > 0) {
                logger.log(
                    `Found blame round for account ~~${account.accountKey}~~ with ${utxos.length} inputs`,
                );
                inputs.push(
                    ...utxos.map(utxo =>
                        aliceGenerator(account.accountKey, account.scriptType, utxo),
                    ),
                );
            }
        });

        if (inputs.length > 0) {
            round.inputs.push(...inputs);
            logger.log(`Created blame round ~~${round.id}~~ with ${round.inputs.length} inputs`);
            return true;
        }
        return false;
    });

// Use middleware algorithm to process preselected CoinjoinRounds and Accounts
export const selectInputsForRound = async ({
    aliceGenerator,
    roundCandidates,
    accountCandidates,
    options,
}: SelectInputsForRoundProps) => {
    // NOTE: regular Round.blameOf field is 64 length string filled with 0
    // blame Round.blameOf is pointing to previously failed round id
    const noBlameOf = '0'.repeat(64);
    const [normalRounds, blameOfRounds] = arrayPartition(
        roundCandidates,
        r => r.blameOf === noBlameOf,
    );
    // Accounts awaiting for blame round are prioritized
    // do not register them anywhere else until blame round is resolved
    const [normalAccounts, blameOfAccounts] = arrayPartition(accountCandidates, r => !r.blameOf);

    if (blameOfAccounts.length > 0) {
        const blameRound = selectInputsForBlameRound({
            aliceGenerator,
            roundCandidates: blameOfRounds,
            accountCandidates: blameOfAccounts,
            options,
        });
        return blameRound;
    }

    const { logger } = options;

    // utxoSelection shape: array_of_rounds[ array_of_accounts[ array_of_useful_account_utxo_indexes[] ] ]
    // example for 2 roundCandidates with 3 accountCandidates: [ [ [], [], [0, 1, 2] ], [ [3], [], [0, 1, 2] ] ]
    // each account/utxo set needs to be calculated separately because of different targetAnonymity
    const utxoSelection = await Promise.all(
        // for each CoinjoinRound...
        normalRounds.map(round => {
            // ...create set of parameters
            const { roundParameters } = round;
            const roundConstants = {
                miningFeeRate: roundParameters.miningFeeRate,
                coordinationFeeRate: roundParameters.coordinationFeeRate,
                allowedInputAmounts: roundParameters.allowedInputAmounts,
                allowedOutputAmounts: roundParameters.allowedOutputAmounts,
                allowedInputTypes: roundParameters.allowedInputTypes,
            };
            return Promise.all(
                // ...and for each Account
                normalAccounts.map(account => {
                    // ...also create set of parameters (utxos)
                    const utxos = account.utxos.map(utxo => ({
                        outpoint: utxo.outpoint,
                        amount: utxo.amount,
                        scriptPubKey: utxo.scriptPubKey,
                        anonymitySet: utxo.anonymityLevel,
                    }));

                    // skip Round candidate if fees are greater than allowed by account
                    if (
                        roundParameters.miningFeeRate > account.maxFeePerKvbyte ||
                        roundParameters.coordinationFeeRate.rate > account.maxCoordinatorFeeRate
                    ) {
                        logger.log(
                            `Skipping round ~~${round.id}~~ for ~~${account.accountKey}~~. Fees to high ${roundParameters.miningFeeRate} ${roundParameters.coordinationFeeRate.rate}`,
                        );
                        return [];
                    }

                    // ...finally call get liquidityClue and
                    // try to select the best utxos combination for given Round
                    return middleware
                        .getLiquidityClue(
                            account.rawLiquidityClue,
                            roundParameters.maxSuggestedAmount,
                            { baseUrl: options.middlewareUrl },
                        )
                        .then(liquidityClue =>
                            middleware.selectInputsForRound(
                                {
                                    ...roundConstants,
                                    utxos,
                                    anonScoreTarget: account.targetAnonymity,
                                    liquidityClue,
                                    semiPrivateThreshold: 2,
                                    consolidationMode: false,
                                },
                                {
                                    signal: options.signal,
                                    baseUrl: options.middlewareUrl,
                                },
                            ),
                        )
                        .then(indices => indices.filter(i => utxos[i])) // filter valid existing indices
                        .catch(error => {
                            logger.error(`selectInputsForRound failed ${error.message}`);
                            return [] as number[];
                        });
                }),
            );
        }),
    );

    // find Round with maximum possible utxos
    const sumUtxosInRounds = utxoSelection.map(acc => acc.reduce((a, b) => a + b.length, 0));
    const maxUtxosInRound = Math.max(...sumUtxosInRounds);
    if (maxUtxosInRound < 1) {
        logger.log('No results from selectInputsForRound');
        return;
    }

    // get index of Round with maximum possble utxos
    const roundIndex = sumUtxosInRounds.findIndex(count => count === maxUtxosInRound);
    const selectedRound = normalRounds[roundIndex];

    // setup new Round
    accountCandidates.forEach((account, accountIndex) => {
        // find utxos assigned to this Round and Account
        const utxoIndexes = utxoSelection[roundIndex][accountIndex];
        const selectedUtxos = utxoIndexes.map(utxoIndex => account.utxos[utxoIndex]);
        if (selectedUtxos.length > 0) {
            // create new Alice(s) and add it to CoinjoinRound
            selectedRound.inputs.push(
                ...selectedUtxos.map(utxo =>
                    aliceGenerator(account.accountKey, account.scriptType, utxo),
                ),
            );
        }
    });

    return selectedRound;
};

export const selectRound = async ({
    roundGenerator,
    aliceGenerator,
    accounts,
    statusRounds,
    coinjoinRounds,
    prison,
    options,
    runningAffiliateServer,
}: SelectRoundProps) => {
    const { logger, setSessionPhase } = options;

    const unregisteredAccounts = getUnregisteredAccounts({ accounts, coinjoinRounds, options });
    const unregisteredAccountKeys = unregisteredAccounts.map(({ accountKey }) => accountKey);

    logger.log('Looking for rounds');
    if (!runningAffiliateServer) {
        logger.warn('Affiliate server is not running. Round selection ignored');
        setSessionPhase({
            phase: SessionPhase.AffiliateServerOffline,
            accountKeys: unregisteredAccountKeys,
        });
        return;
    }

    setSessionPhase({ phase: SessionPhase.RoundSearch, accountKeys: unregisteredAccountKeys });
    const roundCandidates = getRoundCandidates({
        roundGenerator,
        statusRounds,
        coinjoinRounds,
        options,
        prison,
    });
    if (roundCandidates.length < 1) {
        logger.log('No suitable rounds');
        return;
    }

    logger.log('Looking for accounts');
    setSessionPhase({ phase: SessionPhase.CoinSelection, accountKeys: unregisteredAccountKeys });
    const accountCandidates = getAccountCandidates({
        accounts: unregisteredAccounts,
        coinjoinRounds,
        prison,
        options,
    });

    if (accountCandidates.length < 1) {
        logger.log('No suitable accounts');
        return;
    }

    logger.log(`Looking for utxos`);
    setSessionPhase({ phase: SessionPhase.RoundPairing, accountKeys: unregisteredAccountKeys });
    const newRound = await selectInputsForRound({
        aliceGenerator,
        roundCandidates,
        accountCandidates,
        options,
    });
    if (!newRound) {
        logger.log('No suitable utxos');
        setSessionPhase({
            phase: SessionPhase.RetryingRoundPairing,
            accountKeys: unregisteredAccountKeys,
        });
        return;
    }

    logger.log(`Created new round ~~${newRound.id}~~ with ${newRound.inputs.length} inputs`);
    return newRound;
};
