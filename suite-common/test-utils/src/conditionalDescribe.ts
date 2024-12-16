export const conditionalDescribe = (condition: boolean, title: string, fn: jest.EmptyFunction) => {
    if (condition) {
        describe(title, fn);
    } else {
        describe.skip(title, fn);
    }
};
