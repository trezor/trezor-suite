export const getSolanaValidatorFixtures = [
    {
        description: 'should return mainnet validator address by default',
        result: '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF',
    },
    {
        description: 'should return mainnet validator address for Mainnet Network.',
        network: 'mainnet-beta',
        result: '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF',
    },
    {
        description: 'should return devnet validator address for Devnet Network.',
        network: 'devnet',
        result: 'GkqYQysEGmuL6V2AJoNnWZUz2ZBGWhzQXsJiXm2CLKAN',
    },
];
