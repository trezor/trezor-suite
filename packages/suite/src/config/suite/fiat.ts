export default {
    tickers: [
        { symbol: 'eth', url: 'https://api.coingecko.com/api/v3/coins/ethereum' },
        { symbol: 'etc', url: 'https://api.coingecko.com/api/v3/coins/ethereum-classic' },
        { symbol: 'xrp', url: 'https://api.coingecko.com/api/v3/coins/ripple' },
        { symbol: 'btc', url: 'https://api.coingecko.com/api/v3/coins/bitcoin' },
        { symbol: 'ltc', url: 'https://api.coingecko.com/api/v3/coins/litecoin' },
        { symbol: 'bch', url: 'https://api.coingecko.com/api/v3/coins/bitcoin-cash' },
        { symbol: 'btg', url: 'https://api.coingecko.com/api/v3/coins/bitcoin-gold' },
        { symbol: 'dash', url: 'https://api.coingecko.com/api/v3/coins/dash' },
        { symbol: 'dgb', url: 'https://api.coingecko.com/api/v3/coins/digibyte' },
        { symbol: 'doge', url: 'https://api.coingecko.com/api/v3/coins/dogecoin' },
        { symbol: 'vtc', url: 'https://api.coingecko.com/api/v3/coins/vertcoin' },
        { symbol: 'nmc', url: 'https://api.coingecko.com/api/v3/coins/namecoin' },
        { symbol: 'zec', url: 'https://api.coingecko.com/api/v3/coins/zcash' },
    ],
    currencies: [
        'usd',
        'eur',
        'gbp',
        'aed',
        'ars',
        'aud',
        'bdt',
        'bhd',
        'bmd',
        'brl',
        'cad',
        'chf',
        'clp',
        'cny',
        'czk',
        'dkk',
        'hkd',
        'huf',
        'idr',
        'ils',
        'inr',
        'jpy',
        'krw',
        'kwd',
        'lkr',
        'mmk',
        'mxn',
        'myr',
        'nok',
        'nzd',
        'php',
        'pkr',
        'pln',
        'rub',
        'sar',
        'sek',
        'sgd',
        'thb',
        'try',
        'twd',
        'vef',
        'vnd',
        'zar',
        'xdr',
        'xag',
        'xau',
    ],
} as const;
