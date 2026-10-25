import { type GroupElement } from './groupElement';

/** Port of `NWabiSabi/WabiSabi/Crypto/CredentialIssuerParameters.cs`. */
export class CredentialIssuerParameters {
    constructor(
        readonly Cw: GroupElement,
        readonly I: GroupElement,
    ) {
        if (Cw.isInfinity) {
            throw new Error('Cw cannot be the point at infinity.');
        }
        if (I.isInfinity) {
            throw new Error('I cannot be the point at infinity.');
        }
    }

    toString() {
        return `Cw: ${this.Cw}, I: ${this.I}`;
    }
}
