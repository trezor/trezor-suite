import { LUGANODES_TRON_SRS, P2P_ORG_TRON_SRS, asNetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { classifyTronStakingTransaction } from './tronStakingTransactions';
import { TRON_STAKING_CONTRACT_TYPES } from '../tronStakingConstants';

const [luganodesSr = ''] = LUGANODES_TRON_SRS;
const [p2pOrgSr = ''] = P2P_ORG_TRON_SRS;

type TronSpecificFixture = WalletAccountTransaction['tronSpecific'];

const tronTransaction = (tronSpecific?: TronSpecificFixture): WalletAccountTransaction =>
    ({ symbol: asNetworkSymbol('trx'), tronSpecific }) as unknown as WalletAccountTransaction;

describe(classifyTronStakingTransaction.name, () => {
    it('classifies every staking contract type', () => {
        TRON_STAKING_CONTRACT_TYPES.forEach(contractType => {
            expect(
                classifyTronStakingTransaction(tronTransaction({ contractType })),
            ).not.toBeNull();
        });
    });

    it('maps contract types to operations', () => {
        const operationOf = (contractType: string) =>
            classifyTronStakingTransaction(tronTransaction({ contractType }))?.operation;

        expect(operationOf('FreezeBalanceV2Contract')).toBe('freeze');
        expect(operationOf('UnfreezeBalanceV2Contract')).toBe('unfreeze');
        expect(operationOf('VoteWitnessContract')).toBe('vote');
        expect(operationOf('WithdrawExpireUnfreezeContract')).toBe('withdraw');
        expect(operationOf('WithdrawBalanceContract')).toBe('claim');
    });

    it('names the products a vote goes to', () => {
        expect(
            classifyTronStakingTransaction(
                tronTransaction({
                    contractType: 'VoteWitnessContract',
                    votes: [
                        { address: p2pOrgSr, count: '10' },
                        { address: 'TOtherSuperRepresentative', count: '5' },
                    ],
                }),
            ),
        ).toEqual({ operation: 'vote', productIds: ['trx:trx:p2p.org:native'] });
        expect(
            classifyTronStakingTransaction(
                tronTransaction({
                    contractType: 'VoteWitnessContract',
                    votes: [
                        { address: p2pOrgSr, count: '10' },
                        { address: luganodesSr, count: '5' },
                    ],
                }),
            )?.productIds,
        ).toEqual(['trx:trx:luganodes:native', 'trx:trx:p2p.org:native']);
    });

    it('names no product for operations on the whole account', () => {
        expect(
            classifyTronStakingTransaction(
                tronTransaction({ contractType: 'FreezeBalanceV2Contract', resource: 'energy' }),
            ),
        ).toEqual({ operation: 'freeze', productIds: [] });
    });

    it('ignores other transactions', () => {
        expect(
            classifyTronStakingTransaction(tronTransaction({ contractType: 'TransferContract' })),
        ).toBeNull();
        expect(classifyTronStakingTransaction(tronTransaction())).toBeNull();
    });
});
