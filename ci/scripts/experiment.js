/**
 *      - pattern: "methods"
            web-environment: false
            node-environment: true
            methods: "tezosGetAddress,tezosGetPublicKey,tezosSignTransaction"
          - pattern: "methods"
            web-environment: false
            node-environment: true
            methods: "binanceGetAddress,binanceGetPublicKey,binanceSignTransaction"
 */

process.stdout.write(
    JSON.stringify([
        {
            pattern: 'methods',
            'web-environment': false,
            'node-environment': true,
            methods: 'tezosGetAddress,tezosGetPublicKey,tezosSignTransaction',
        },
        {
            pattern: 'methods',
            'web-environment': false,
            'node-environment': true,
            methods: 'binanceGetAddress,binanceGetPublicKey,binanceSignTransaction',
        },
    ]),
);
