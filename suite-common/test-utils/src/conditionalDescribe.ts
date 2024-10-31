export const conditionalDescribe = (
    skipCondition: boolean,
    title: string,
    fn: jest.EmptyFunction,
) => {
    if (skipCondition) {
        // eslint-disable-next-line jest/valid-describe-callback
        describe.skip(title, fn);
    } else {
        // eslint-disable-next-line jest/valid-describe-callback
        describe(title, fn);
    }
};
