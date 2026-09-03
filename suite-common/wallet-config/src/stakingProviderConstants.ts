// Pool and Super Representative identities backing the `stakingProviders` registry. They live
// here rather than with the other staking constants because the registry itself is consumed by
// packages below the wallet core.

export const FIVE_BINARIES_POOLS = [
    'pool1k2qhlrrweu8fecd4hx4hn22lv00nrd3rjdxj6durax7m78q7ynu',
    'pool1nhhsh9yhlrvj9e3nce0zpx0xm2xlt6tx7gqakhr6hjc8wy84sat',
    'pool1z5rt6kn6yvuczj44qla73mfyln9l55lw0jkz6x4kjw00u32zec3',
    'pool1398lzhvtaa0hgz305d2jz4urfkwkkt66yv476wqe6att2f7dphh',
    'pool1z9m2kxeat06t30yf6ar7sqpert0cjdgxzcv2dv36dcwcqcqtgk4',
];

export const EVERSTAKE_POOL_NAMES: Record<string, string> = {
    pool1sysgx87cwxnqy0pqn8g97gdhd0dmre9rw3jvpn2k7apuwa7cgkn: 'EVE6',
    pool1n0uxgs5qfk5n9xl7qvq9jt8zuu02cntrsjnjayjlqtejyffnemj: 'EVE7',
    pool13rt3ngkek4l876980ect869cu978d36dcyh22ts4nwuf7ncq02u: 'EVE8',
};

export const EVERSTAKE_POOLS = Object.keys(EVERSTAKE_POOL_NAMES);

// Super Representative addresses offered for voting in Suite
// source: https://earn.trezor.io/staking/v1/trx/stats
export const LUGANODES_TRON_SRS = ['TGyrSc9ZmTdbYziuk1SKEmdtCdETafewJ9'];
export const P2P_ORG_TRON_SRS = ['TH7Fe1W8CcLeqN4LGfqX1R9EpsnrJBQJij'];
