import { getInputSize, getOutputSize, getWitnessFromSignature } from '../utils/coordinatorUtils';
import {
    AllowedScriptTypes,
    RegistrationData,
    ConfirmationData,
    RealCredentials,
} from '../types/coordinator';
import { AccountUtxo } from '../types/account';
import { Credentials } from '../types/middleware';
import { SerializedAlice, CoinjoinRequestEvent } from '../types/round';

interface AlicePendingRequest {
    type: CoinjoinRequestEvent['type'];
    timestamp: number;
}

export interface AliceConfirmationInterval {
    promise: Promise<Alice>;
    abort: () => void;
}

export class Alice {
    path: string; // utxo derivation path
    outpoint: string;
    amount: number;
    inputSize: number;
    outputSize: number;
    accountKey: string; // Account.accountKey
    scriptType: AllowedScriptTypes; // input scripType
    requested?: AlicePendingRequest; // pending request sent to wallet (Suite)
    resolved: AlicePendingRequest[] = []; // resolved requests received from wallet (Suite)
    ownershipProof?: string; // data used in inputRegistration phase, received as response to RequestEvent, provided by wallet (Suite)
    registrationData?: RegistrationData; // data from inputRegistration phase
    affiliationFlag?: boolean; // affiliation flag is used in /ready-to-sign request **only** when Alice pays coordination fee
    realAmountCredentials?: RealCredentials; // data from inputRegistration phase
    realVsizeCredentials?: RealCredentials; // data from inputRegistration phase
    confirmationInterval?: AliceConfirmationInterval;
    confirmationData?: ConfirmationData; // data from connectionConfirmation phase
    confirmedAmountCredentials?: Credentials[]; // data from connectionConfirmation phase
    confirmedVsizeCredentials?: Credentials[]; // data from connectionConfirmation phase
    witness?: string; // received as response to RequestEvent, provided by wallet (Suite)
    witnessIndex?: number; // received as response to RequestEvent, provided by wallet (Suite)
    error?: Error;

    constructor(accountKey: string, scriptType: AllowedScriptTypes, utxo: AccountUtxo) {
        this.accountKey = accountKey;
        this.scriptType = scriptType;
        this.path = utxo.path;
        this.outpoint = utxo.outpoint;
        this.amount = utxo.amount;
        this.inputSize = getInputSize(scriptType);
        this.outputSize = getOutputSize(scriptType);
    }

    setError(error: Error) {
        this.error = error;
    }

    setRequest(type: AlicePendingRequest['type']): SerializedAlice {
        this.requested = {
            type,
            timestamp: Date.now(),
        };

        return {
            accountKey: this.accountKey,
            path: this.path,
            outpoint: this.outpoint,
        };
    }

    resolveRequest() {
        if (this.requested) {
            this.resolved.push({
                type: this.requested.type,
                timestamp: Date.now() - this.requested.timestamp,
            });
            this.requested = undefined;
        }
    }

    getResolvedRequest(type: AlicePendingRequest['type']) {
        return this.resolved.find(r => r.type === type);
    }

    setOwnershipProof(proof: string) {
        this.ownershipProof = proof;
    }

    setRegistrationData(data: RegistrationData, flag?: boolean) {
        this.registrationData = data;
        this.affiliationFlag = flag;
    }

    setRealCredentials(amount: RealCredentials, vsize: RealCredentials) {
        this.realAmountCredentials = amount;
        this.realVsizeCredentials = vsize;
    }

    setConfirmationInterval(interval: AliceConfirmationInterval) {
        this.confirmationInterval = interval;
    }

    clearConfirmationInterval() {
        this.confirmationInterval?.abort();
        this.confirmationInterval = undefined;
    }

    getConfirmationInterval() {
        return this.confirmationInterval;
    }

    setConfirmationData(data: ConfirmationData) {
        this.confirmationData = data;
    }

    setConfirmedCredentials(amount: Credentials[], vsize: Credentials[]) {
        this.confirmedAmountCredentials = amount;
        this.confirmedVsizeCredentials = vsize;
    }

    setWitness(signature: string, index: number) {
        this.witness = getWitnessFromSignature(signature);
        this.witnessIndex = index;
    }

    // serialize class
    toSerialized(): SerializedAlice {
        return {
            accountKey: this.accountKey,
            path: this.path,
            outpoint: this.outpoint,
            error: this.error?.message,
        };
    }
}
