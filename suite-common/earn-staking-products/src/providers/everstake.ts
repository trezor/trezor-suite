import { stakingProviderSchema } from '@suite-common/earn-staking-common';

export const everstakeProvider = stakingProviderSchema.parse({
    id: 'everstake',
    name: 'Everstake',
    status: 'active',
    links: { website: 'https://everstake.com' },
    identities: {
        eth: ['Everstake'],
        thod: ['Everstake'],
        sol: ['9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF'],
        dsol: ['GkqYQysEGmuL6V2AJoNnWZUz2ZBGWhzQXsJiXm2CLKAN'],
        ada: [
            'pool1sysgx87cwxnqy0pqn8g97gdhd0dmre9rw3jvpn2k7apuwa7cgkn',
            'pool1n0uxgs5qfk5n9xl7qvq9jt8zuu02cntrsjnjayjlqtejyffnemj',
            'pool13rt3ngkek4l876980ect869cu978d36dcyh22ts4nwuf7ncq02u',
            'pool1xflehvzad4wr6rrvf6eea65jst5af0r4k0rh4xvmnqgvkzt3xjt',
        ],
    },
});
