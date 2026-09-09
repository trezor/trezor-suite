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

/** @deprecated Use the replacement. */
export function mockTaggedFunction() {
    return 'value';
}

/** @internal */
export const mockTaggedValue = 'value';

/** @internal */
export class MockTaggedClass {
    value = 'value';
}
