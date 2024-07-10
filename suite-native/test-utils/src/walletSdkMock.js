jest.mock('@everstake/wallet-sdk/ethereum', () => ({
    selectNetwork: jest.fn().mockImplementation(network => {
        return {
            address_pool: `mocked_pool_${network}`,
            address_withdraw_treasury: `mocked_treasury_${network}`,
        };
    }),
}));
