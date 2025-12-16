export const mockNotExpected = <T extends (...args: any[]) => any>(key: string) =>
    jest.fn<ReturnType<T>, Parameters<T>>().mockImplementation(() => {
        throw new Error(`Method ${key} was not expected to be called`);
    });
