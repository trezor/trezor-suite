import type { AccountUtxo } from './account';
import type {
    AllowedScriptTypes,
    ConfirmationData,
    RealCredentials,
    RegistrationData,
} from './coordinator';
import type { Credentials } from './middleware';

export interface AlicePendingRequest {
    type: 'ownership' | 'signature';
    timestamp: number;
}

export interface AliceConfirmationInterval {
    promise: Promise<AliceShape>;
    abort: () => void;
}

// shape of src/client/Alice.ts
export interface AliceShape {
    path: string; // utxo derivation path
    outpoint: string;
    amount: number;
    inputSize: number;
    outputSize: number;
    accountKey: string; // Account.accountKey
    scriptType: AllowedScriptTypes; // input scripType
    requested?: AlicePendingRequest; // pending request sent to wallet (Suite)
    resolved: AlicePendingRequest[]; // resolved requests received from wallet (Suite)
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

    getConfirmationInterval(): AliceConfirmationInterval | undefined;
    setConfirmationInterval(interval: AliceConfirmationInterval): void;
    clearConfirmationInterval(): void;
    setError(error: Error): void;
    setConfirmationData(data: ConfirmationData): void;
    setConfirmedCredentials(amount: Credentials[], vsize: Credentials[]): void;
    setRegistrationData(data: RegistrationData, flag?: boolean): void;
    setRealCredentials(amount: RealCredentials, vsize: RealCredentials): void;
    getResolvedRequest(type: AlicePendingRequest['type']): AlicePendingRequest | undefined;
}

export type AliceGenerator = (
    accountKey: string,
    scriptType: AllowedScriptTypes,
    utxo: AccountUtxo,
) => AliceShape;

export interface SerializedAlice {
    accountKey: string;
    path: string;
    outpoint: string;
    error?: string;
}
