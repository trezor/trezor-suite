import { type TokenDefinitions } from '../tokenDefinitionsTypes';
import { type PhishingDetectorFn, type TransactionWithFiatAmount } from './types';

export class PhishingTransactionValidator {
    private transaction?: TransactionWithFiatAmount;
    private tokenDefinitions?: TokenDefinitions;
    private detectors: PhishingDetectorFn[] = [];

    public addDetector(detector: PhishingDetectorFn) {
        this.detectors.push(detector);

        return this;
    }

    public setTransaction(transaction?: TransactionWithFiatAmount) {
        this.transaction = transaction;

        return this;
    }

    public setTokenDefinitions(tokenDefinitions?: TokenDefinitions) {
        this.tokenDefinitions = tokenDefinitions;

        return this;
    }

    public validate() {
        if (!this.transaction) return false;

        for (const detector of this.detectors) {
            const { isPhishing, transaction } = detector({
                transaction: this.transaction,
                tokenDefinitions: this.tokenDefinitions,
            });

            if (isPhishing) {
                return true;
            }

            if (transaction) {
                this.transaction = transaction;
            }
        }

        return false;
    }

    public getDetectors() {
        return this.detectors;
    }
}
