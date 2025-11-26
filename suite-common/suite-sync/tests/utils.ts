export const mockNotExpected = (key: string) => () => {
    throw new Error(`Method ${key} was not expected to be called`);
};
