jest.mock('@suite-native/icons', () => {
    const originalModule = jest.requireActual('@suite-native/icons');

    return {
        __esModule: true,
        ...originalModule,
        Icon: props => JSON.stringify(props),
        CryptoIcon: props => JSON.stringify(props),
    };
});
