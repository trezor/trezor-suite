jest.mock('@suite-common/icons', () => {
    const originalModule = jest.requireActual('@suite-common/icons');

    return {
        __esModule: true,
        ...originalModule,
        Icon: props => JSON.stringify(props),
        CryptoIcon: props => JSON.stringify(props),
        FlagIcon: props => JSON.stringify(props),
    };
});
