/** @serviceContract */
export type MockResolveNamedAddress = (value: string) => Promise<string | null>;

/** @serviceContract */
export interface MockStorage {
    save: () => void;
}

export type MockUnmarkedService = () => void;

/** @serviceContract */
type MockLocallyExportedContract = () => void;

export type { MockLocallyExportedContract };
