import { updateAccountsUtxos } from '../clientUtils';
import { RequestEvent, RoundPhase, ActiveRound } from '../../types';

// Get wallet request from processed ActiveRounds
export const getRequests = (rounds: ActiveRound[]): RequestEvent[] =>
    rounds.flatMap(round => {
        const accountsInRound = Object.keys(round.accounts).reduce((result, key) => {
            const utxosWithoutOwnership = round.accounts[key].utxos
                .filter(
                    utxo =>
                        (round.phase === RoundPhase.InputRegistration && !utxo.ownershipProof) ||
                        (round.phase === RoundPhase.TransactionSigning && !utxo.witness),
                )
                .map(utxo => ({
                    path: utxo.path,
                    outpoint: utxo.outpoint,
                }));
            if (utxosWithoutOwnership.length > 0) {
                result[key] = {
                    utxos: utxosWithoutOwnership,
                    addresses: round.accounts[key].addresses,
                };
            }

            return result;
        }, {} as RequestEvent['accounts']);

        if (Object.keys(accountsInRound).length < 1) {
            return [];
        }

        // TODO: prevent from multiple requests to wallet(waiting for...)

        if (round.phase === RoundPhase.InputRegistration) {
            return {
                type: 'ownership',
                round: round.id,
                accounts: accountsInRound,
                commitmentData: round.commitmentData,
            };
        }

        if (round.phase === RoundPhase.TransactionSigning && round.transactionData) {
            return {
                type: 'witness',
                round: round.id,
                accounts: accountsInRound,
                transaction: round.transactionData,
            };
        }

        return [];
    });

// Update ActiveRound with data provided by wallet
export const resolveRequests = (rounds: ActiveRound[], response: RequestEvent[]): ActiveRound[] =>
    response.flatMap(event => {
        const round = rounds.find(r => r.id === event.round);
        if (!round) return [];

        const utxosInRound = Object.values(round.accounts).flatMap(account => account.utxos);
        const utxosInResponse = Object.values(event.accounts).flatMap(account => account.utxos);
        // const accountsInRound = Object.keys(round.accounts);
        // const accountsInResponse = Object.keys(event.accounts).filter(key =>
        //     accountsInRound.includes(key),
        // );

        // console.warn('RESOLVE REQUEST', response, accountsInResponse);

        const utxos = utxosInResponse.flatMap(utxo => {
            const known = utxosInRound.find(u => u.outpoint === utxo.outpoint);
            if (known) {
                if (utxo.error) {
                    return {
                        ...known,
                        error: new Error(utxo.error),
                    };
                }
                const enhancement =
                    event.type === 'ownership'
                        ? { ownershipProof: utxo.ownershipProof }
                        : { witness: utxo.witness, witnessIndex: utxo.witnessIndex };
                return {
                    ...known,
                    ...enhancement,
                };
            }
            return [];
        });

        return {
            ...round,
            accounts: updateAccountsUtxos(round.accounts, utxos),
        };
    });
