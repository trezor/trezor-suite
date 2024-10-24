export const conditionalDescribe = (
    skipCondition: boolean,
    title: string,
    fn: jest.EmptyFunction,
) => {
    if (skipCondition) {
        describe.skip(title, fn);
    } else {
        describe(title, fn);
    }
};
