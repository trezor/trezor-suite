jest.mock('@suite-common/icons-deprecated', () => {
    const originalModule = jest.requireActual('@suite-common/icons-deprecated');

    return {
        __esModule: true,
        ...originalModule,
        Icon: props => JSON.stringify(props),
        CryptoIcon: props => JSON.stringify(props),
        FlagIcon: props => JSON.stringify(props),
    };
});
