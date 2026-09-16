import { getStellarOperationLabel } from './transactionLabels';

describe(getStellarOperationLabel.name, () => {
    it('names an operation that only changes the ledger', () => {
        expect(getStellarOperationLabel({ operationType: 'setOptions' })).toBe('setOptions');
        expect(getStellarOperationLabel({ operationType: 'allowTrust' })).toBe('trustlineFlags');
    });

    it('tells a balance offered to the account from one it created', () => {
        expect(
            getStellarOperationLabel({
                operationType: 'createClaimableBalance',
                claimableBalanceOffer: { isClaimant: true },
            }),
        ).toBe('claimableBalanceOffered');
        expect(
            getStellarOperationLabel({
                operationType: 'createClaimableBalance',
                claimableBalanceOffer: { isClaimant: false },
            }),
        ).toBe('claimableBalanceCreated');
    });

    it('leaves a trustline change with details to the detailed wording', () => {
        expect(
            getStellarOperationLabel({ operationType: 'changeTrust', changeTrust: {} }),
        ).toBeUndefined();
        expect(getStellarOperationLabel({ operationType: 'changeTrust' })).toBe('trustlineUpdated');
    });

    it('leaves a movement of value unnamed', () => {
        expect(getStellarOperationLabel({ operationType: 'payment' })).toBeUndefined();
        expect(getStellarOperationLabel({})).toBeUndefined();
    });
});
