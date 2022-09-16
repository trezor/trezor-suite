jest.mock('@trezor/icons', () => {
    const originalModule = jest.requireActual('@trezor/icons');
    return {
        __esModule: true,
        ...originalModule,
        Icon: props => JSON.stringify(props),
        CryptoIcon: props => JSON.stringify(props),
        FlagIcon: props => JSON.stringify(props),
    };
});
