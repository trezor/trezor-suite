export interface PrisonInmate {
    id: string; // AccountUtxo/Alice.outpoint or AccountAddress scriptPubKey
    punishmentStart: number;
    punishmentEnd: number;
    reason?: string; // TODO: some enum?
    roundId?: string;
}

export interface PrisonOptions {
    roundId?: string;
    reason?: string;
    punishmentEnd?: number;
}

// Malicious or currently registered inputs and addresses are sent here.
// inspiration: WalletWasabi/WabiSabi/Backend/Banning/Prison.cs

export class CoinjoinPrison {
    lastChange: number; // Timestamp of the latest change happened in the prison.
    inmates: PrisonInmate[] = [];

    constructor() {
        this.lastChange = Date.now();
    }

    ban(id: string, options: PrisonOptions = {}) {
        const punishmentStart = Date.now();
        const punishmentEnd =
            Date.now() + (options.punishmentEnd ? options.punishmentEnd : 6 * 60000);

        this.inmates.push({
            id,
            punishmentEnd,
            punishmentStart,
            reason: options.reason,
            roundId: options.roundId,
        });
    }

    isBanned(id: string) {
        return this.inmates.find(i => i.id === id);
    }

    // called on each status change before rounds are processed
    tryRelease() {
        const now = Date.now();
        // release from prison
        this.inmates = this.inmates.filter(inmate => inmate.punishmentEnd > now);
    }
}
