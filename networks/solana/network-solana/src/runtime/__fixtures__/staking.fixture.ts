export const getSolanaValidatorFixtures = [
    {
        description: 'should return mainnet validator address for Mainnet Network.',
        symbol: 'sol',
        result: '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF',
    },
    {
        description: 'should return devnet validator address for Devnet Network.',
        symbol: 'dsol',
        result: 'GkqYQysEGmuL6V2AJoNnWZUz2ZBGWhzQXsJiXm2CLKAN',
    },
] as const;
