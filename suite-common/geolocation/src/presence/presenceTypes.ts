export type PresenceEvidence = 'none' | 'weak' | 'strong';

export type PresenceEstimate = { score: number; evidence: PresenceEvidence };

export type PresenceSignals = {
    ipCountry: string | null;
    timeZone: string | null;
    primaryRegion: string | null;
    secondaryRegions: readonly string[];
};

export type DevicePresenceSignals = Omit<PresenceSignals, 'ipCountry'>;
