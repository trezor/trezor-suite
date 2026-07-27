import type { WabiSabiProtocolErrorCode } from '../enums';

export interface CoinjoinPrisonEvents {
    change: { prison: CoinjoinPrisonInmate[] };
}

export interface CoinjoinPrisonInmate {
    type: 'input' | 'output' | 'account';
    accountKey: string;
    id: string; // AccountUtxo/Alice.outpoint or AccountAddress scriptPubKey or Account key
    sentenceStart: number;
    sentenceEnd: number;
    errorCode?: WabiSabiProtocolErrorCode | 'blameOf';
    reason?: string;
    roundId?: string;
}

export type DetainObject =
    | {
          outpoint: string;
          accountKey: string;
      }
    | {
          address: string;
          accountKey: string;
      }
    | {
          accountKey: string;
      };

export interface DetainOptions {
    roundId?: string;
    errorCode?: CoinjoinPrisonInmate['errorCode'];
    reason?: CoinjoinPrisonInmate['reason'];
    sentenceEnd?: number;
}

// shape if src/client/CoinjoinPrison.ts
export interface CoinjoinPrisonShape {
    inmates: CoinjoinPrisonInmate[];
    detain(inmate: DetainObject, options?: DetainOptions): void;
    isDetained(inmate: string | DetainObject): CoinjoinPrisonInmate | undefined;
    detainForBlameRound(inmates: DetainObject[], roundId: string): void;
    getBlameOfInmates(): CoinjoinPrisonInmate[];
    releaseBlameOfInmates(roundId: string): void;
    releaseRegisteredInmates(roundId: string): void;
    release(rounds: string[]): void;
}
