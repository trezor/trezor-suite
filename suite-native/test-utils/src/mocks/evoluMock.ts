export const createEvolu = jest.fn();
export const evolu = jest.fn();
export const SyncOwner = jest.fn();
export const createOwnerWebSocketTransport = jest.fn();
export const Evolu = jest.fn();

export const evoluReactNativeDeps = {
    reload: jest.fn(),
    platformInfo: {},
};

export const systemColumns = {
    difference: jest.fn(() => []),
};

export const Schema = {
    systemColumns,
};

export const id = jest.fn((name: string) => ({
    Type: Symbol(name),
    name,
}));

export const table = jest.fn(() => ({}));
export const database = jest.fn(() => ({}));
export const column = jest.fn(() => ({}));
export const cast = jest.fn((value: any) => value);
export const nullOr = jest.fn((schema: any) => schema);
export const NonEmptyString1000 = jest.fn();
export const NonEmptyString100 = jest.fn();
export const String = jest.fn();
export const Boolean = jest.fn();
export const Int = jest.fn();
export const SqliteBoolean = jest.fn();
export const Nullable = jest.fn();
