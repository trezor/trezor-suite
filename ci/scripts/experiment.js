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
    `matrix=${
        JSON.stringify({
            include: [
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
            ],
        })
        // .replaceAll('"', '\\"')
    }`,
);
