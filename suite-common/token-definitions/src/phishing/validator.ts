import { type TokenDefinitions } from '../tokenDefinitionsTypes';
import type {
    PhishingDetector,
    PhishingTransactionValidatorResult,
    TransactionWithFiatAmount,
} from './types';
import { createPhishingResult } from './utils';
export class PhishingTransactionValidator {
    private transaction?: TransactionWithFiatAmount;
    private tokenDefinitions?: TokenDefinitions;
    private dustThreshold?: string;
    private detectors: PhishingDetector[] = [];

    public addDetector(detector: PhishingDetector) {
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

    public setDustThreshold(dustThreshold?: string) {
        this.dustThreshold = dustThreshold;

        return this;
    }

    public validate(): PhishingTransactionValidatorResult {
        if (!this.transaction) return createPhishingResult(false);

        for (const detector of this.detectors) {
            const { isPhishing, transaction } = detector.validator({
                transaction: this.transaction,
                tokenDefinitions: this.tokenDefinitions,
                dustThreshold: this.dustThreshold,
            });

            if (isPhishing) {
                return createPhishingResult(true, detector.id);
            }

            if (transaction) {
                this.transaction = transaction;
            }
        }

        return createPhishingResult(false);
    }

    public getDetectors() {
        return this.detectors;
    }
}
