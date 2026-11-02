import { stakingProviderSchema } from '@suite-common/earn-staking-common';

export const fivebinariesProvider = stakingProviderSchema.parse({
    id: 'fivebinaries',
    name: 'FiveBinaries',
    status: 'retired',
    identities: {
        ada: [
            'pool1k2qhlrrweu8fecd4hx4hn22lv00nrd3rjdxj6durax7m78q7ynu',
            'pool1nhhsh9yhlrvj9e3nce0zpx0xm2xlt6tx7gqakhr6hjc8wy84sat',
            'pool1z5rt6kn6yvuczj44qla73mfyln9l55lw0jkz6x4kjw00u32zec3',
            'pool1398lzhvtaa0hgz305d2jz4urfkwkkt66yv476wqe6att2f7dphh',
            'pool1z9m2kxeat06t30yf6ar7sqpert0cjdgxzcv2dv36dcwcqcqtgk4',
        ],
    },
});
