import TXS from './transactions';

const DISCOVERIES = [{"deviceState":"7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f","index":0,"status":4,"total":35,"bundleSize":0,"loaded":39,"failed":[],"networks":["btc","btc","btc","test","test","test","eth","txrp"]}]

export const getAccountTransactions = [
    // BTC account, 2txs
    {
        testName: "BTC account, 2txs",
        transactions: TXS,
        account: {"deviceState":"7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f","index":0,"path":"m/84'/0'/0'","descriptor":"zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT","accountType":"normal","networkType":"bitcoin","symbol":"btc","empty":false,"visible":true,"balance":"0","availableBalance":"0","addresses":{"change":[{"address":"bc1qktmhrsmsenepnnfst8x6j27l0uqv7ggrg8x38q","path":"m/84'/0'/0'/1/0","transfers":0}],"used":[{"address":"bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk","path":"m/84'/0'/0'/0/0","transfers":2,"balance":"0","sent":"9426","received":"9426"}],"unused":[{"address":"bc1q7e6qu5smalrpgqrx9k2gnf0hgjyref5p36ru2m","path":"m/84'/0'/0'/0/1","transfers":0},{"address":"bc1qgg7cs4eq2l4qddud4nqhqh656560x6r7mlftfl","path":"m/84'/0'/0'/0/20","transfers":0}]},"utxo":[],"history":{"total":2,"unconfirmed":0},"page":{"index":1,"size":25,"total":1}},
        result: [{"amount": "0.00006497", "blockHash": "00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51", "blockHeight": 590093, "blockTime": 1565797979, "descriptor": "zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT", "deviceState": "7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f", "fee": "0.00002929", "page": 1, "symbol": "btc", "targets": [{"addresses": ["36JkLACrdxARqXXffZk91V9W6SJvghKaVK"], "amount": "0.00006497"}], "tokens": [], "txid": "7e58757f43015242c0efa29447bea4583336f2358fdff587b52bbe040ad8982a", "type": "sent"}, {"amount": "0.00319322", "blockHash": "00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51", "blockHeight": 590093, "blockTime": 1565797979, "descriptor": "zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT", "deviceState": "7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f", "fee": "0.00000166", "page": 1, "symbol": "btc", "targets": [{"addresses": ["3Bvy87TmQhhSBqfiCBh8w5yPx6usiDM8SY"], "amount": "0.00319488"}], "tokens": [], "txid": "fa80a9949f1094119195064462f54d0e0eabd3139becd4514ae635b8c7fe3a46", "type": "recv"}],
    },
    // XRP testnet account, 54
    {
      testName: "XRP testnet account, 2",
        transactions: TXS,
        account: {"deviceState":"7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f","index":0,"path":"m/44'/144'/0'/0/0","descriptor":"rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H","accountType":"normal","networkType":"ripple","symbol":"txrp","empty":false,"visible":true,"balance":"935200000","availableBalance":"915200000","history":{"total":-1,"unconfirmed":0,"transactions":[]},"misc":{"sequence":1,"reserve":"20000000"},"marker":null},
        result: [{
          "descriptor": "rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H",
          "deviceState": "7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f",
          "symbol": "txrp",
          "type": "recv",
          "txid": "A62FDA65E3B84FA2BED47086DB9458CFF8AF475196E327FC51DA0143BD998A9B",
          "blockTime": 621951942,
          "blockHeight": 454901,
          "blockHash": "A62FDA65E3B84FA2BED47086DB9458CFF8AF475196E327FC51DA0143BD998A9B",
          "amount": "0.1",
          "fee": "0.000012",
          "targets": [
            {
              "addresses": [
                "rMGDshGtHriKoC4pGGzWxyQfof1Gk9zV5k"
              ],
              "isAddress": true,
              "amount": "0.1"
            }
          ],
          "tokens": [],
          "page": 1
        },
        {
          "descriptor": "rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H",
          "deviceState": "7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f",
          "symbol": "txrp",
          "type": "recv",
          "txid": "DFA960521E384047E56946F9A441FB717475D132E49737A347CA8B6C80AFC84B",
          "blockTime": 621951942,
          "blockHeight": 454901,
          "blockHash": "DFA960521E384047E56946F9A441FB717475D132E49737A347CA8B6C80AFC84B",
          "amount": "0.1",
          "fee": "0.000012",
          "targets": [
            {
              "addresses": [
                "rMGDshGtHriKoC4pGGzWxyQfof1Gk9zV5k"
              ],
              "isAddress": true,
              "amount": "0.1"
            }
          ],
          "tokens": [],
          "page": 1
        }],
      },
      // eth account, 13 txs
      {
        testName: "eth account, 13 txs",
        transactions: TXS,
        account: {"deviceState":"7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f","index":1,"path":"m/44'/60'/0'/0/1","descriptor":"0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15","accountType":"normal","networkType":"ethereum","symbol":"eth","empty":false,"visible":true,"balance":"0","availableBalance":"0","tokens":[{"type":"ERC20","name":"Golem Network Token","symbol":"GNT","address":"0xa74476443119a942de498590fe1f2454d7d4ac0d","balance":"0","decimals":18}],"history":{"total":13,"tokens":2,"unconfirmed":0},"misc":{"nonce":"6"},"page":{"index":1,"size":25,"total":1}},
        result: [{"descriptor":"0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15","deviceState":"7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f","symbol":"eth","type":"sent","txid":"0xb7255fd30ebfe39f755d00c60fd243a5b160f1a519f24602aeb8105a8a581427","blockTime":1534949840,"blockHeight":6193901,"blockHash":"0x89d49e127d4808bc286f5feb5b5ecf0dd5d8e8f22315f04aeb429b4d02677e40","amount":"0.000765215319406","fee":"0.000066522840594","targets":[{"addresses":["0xa6abb480640d6d27d2fb314196d94463cedcb31e"],"isAddress":true,"amount":"0.000765215319406"}],"tokens":[],"ethereumSpecific":{"status":1,"nonce":5,"gasLimit":21000,"gasUsed":21000,"gasPrice":"3167754314"},"page":1},{"descriptor":"0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15","deviceState":"7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f","symbol":"eth","type":"sent","txid":"0x967dbd77f324c38fd4ebd000942d2ff8dbd205102241ca74bfd938a7d4671fe3","blockTime":1534948768,"blockHeight":6193832,"blockHash":"0x71b328cf36fae7385eb21458b86df159919be77180d3c1bf6500f20fadd53330","amount":"0","fee":"0.00004826184","targets":[],"tokens":[{"type":"sent","name":"Golem Network Token","symbol":"GNT","address":"0xa74476443119a942de498590fe1f2454d7d4ac0d","decimals":18,"amount":"67000000000000000","from":"0xfa01a39f8abaeb660c3137f14a310d0b414b2a15","to":"0xa6abb480640d6d27d2fb314196d94463cedcb31e"}],"ethereumSpecific":{"status":1,"nonce":4,"gasLimit":200000,"gasUsed":21720,"gasPrice":"2222000000"},"page":1},{"descriptor":"0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15","deviceState":"7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f","symbol":"eth","type":"recv","txid":"0x1467509b262ca0b719e1d03a48d2831b598b23ab32f6d46b4d3802d1496c21a7","blockTime":1534948575,"blockHeight":6193816,"blockHash":"0x6a668f6343dcca519c2faf907d7c5ee3bb294cea8e8c39fea6058b4feed56cc3","amount":"0.0008","fee":"0.000046662","targets":[{"addresses":["0xa6abb480640d6d27d2fb314196d94463cedcb31e"],"isAddress":true}],"tokens":[],"ethereumSpecific":{"status":1,"nonce":14,"gasLimit":21000,"gasUsed":21000,"gasPrice":"2222000000"},"page":1},{"descriptor":"0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15","deviceState":"7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f","symbol":"eth","type":"recv","txid":"0xef027192e677475f0b54fbb3f4d6db4d9bb9e693e60513076971115ac95375b4","blockTime":1534947053,"blockHeight":6193724,"blockHash":"0x93d5351c8cc79113b7e5cfde961ef78fd6eeb77b65122f72ecad9984628c5d45","amount":"0.00008","fee":"0.0000462","targets":[{"addresses":["0xa6abb480640d6d27d2fb314196d94463cedcb31e"],"isAddress":true}],"tokens":[],"ethereumSpecific":{"status":1,"nonce":13,"gasLimit":21000,"gasUsed":21000,"gasPrice":"2200000000"},"page":1},{"descriptor":"0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15","deviceState":"7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f","symbol":"eth","type":"sent","txid":"0xb4eab09fa610a6b45009230692012cba57ca3a6c671a2700c9509cf983268882","blockTime":1534946826,"blockHeight":6193708,"blockHash":"0xc39eb20a912f24c6da01798344bbf828828788b283f2c0ab1f3a84da2d1226d6","amount":"0.0000238","fee":"0.0000462","targets":[{"addresses":["0xa6abb480640d6d27d2fb314196d94463cedcb31e"],"isAddress":true,"amount":"0.0000238"}],"tokens":[],"ethereumSpecific":{"status":1,"nonce":3,"gasLimit":21000,"gasUsed":21000,"gasPrice":"2200000000"},"page":1},{"descriptor":"0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15","deviceState":"7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f","symbol":"eth","type":"recv","txid":"0xcff0fe117b5daa5ad5d1aa1109145e83c665056dedfc8aa325b06ec189e07cd4","blockTime":1534946486,"blockHeight":6193687,"blockHash":"0xd9f10c31d35bb9251a8625a1023f69bf059c2538be07b41567878a85390c84b8","amount":"0.00007","fee":"0.000063","targets":[{"addresses":["0xa6abb480640d6d27d2fb314196d94463cedcb31e"],"isAddress":true}],"tokens":[],"ethereumSpecific":{"status":1,"nonce":12,"gasLimit":21000,"gasUsed":21000,"gasPrice":"3000000000"},"page":1},{"descriptor":"0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15","deviceState":"7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f","symbol":"eth","type":"recv","txid":"0x34b5ac0006ee42b3406a08d40fc2cfad73ce8f91df7a65e581fce98719f669cb","blockTime":1499785092,"blockHeight":4008020,"blockHash":"0xe3739006850a815fc8263eb62ec08e2a0c4ae72212b2b2180c53d0f08134fbeb","amount":"0","fee":"0.00108612","targets":[],"tokens":[{"type":"recv","name":"Golem Network Token","symbol":"GNT","address":"0xa74476443119a942de498590fe1f2454d7d4ac0d","decimals":18,"amount":"67000000000000000","from":"0x73d0385f4d8e00c5e6504c6030f47bf6212736a8","to":"0xfa01a39f8abaeb660c3137f14a310d0b414b2a15"}],"ethereumSpecific":{"status":-2,"nonce":5,"gasLimit":51721,"gasUsed":51720,"gasPrice":"21000000000"},"page":1},{"descriptor":"0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15","deviceState":"7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f","symbol":"eth","type":"sent","txid":"0x284966d7d5fa3359eb4d17a40d8e0fb8101f413fb4a5b276e811ba4013c303cb","blockTime":1498525694,"blockHeight":3935365,"blockHash":"0x585513c75e3d961e7cd21dc87c74ee8ea0dffa5dee8d7d49652007a026ee792b","amount":"0.000295822","fee":"0.000021","targets":[{"addresses":["0x2f5504be3a6840b438ede909c80874d7d66a78f2"],"isAddress":true,"amount":"0.000295822"}],"tokens":[],"ethereumSpecific":{"status":-2,"nonce":2,"gasLimit":21000,"gasUsed":21000,"gasPrice":"1000000000"},"page":1},{"descriptor":"0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15","deviceState":"7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f","symbol":"eth","type":"recv","txid":"0x63635c5ca1e21d13780d5a0a66cc16dfe0b49ffb9eff191f15b3da271b1ad1d3","blockTime":1495456394,"blockHeight":3748932,"blockHash":"0x4e20bad727d86fb138c2ce1f52141648378c83acc2cd8d5e220f2fd90b581e59","amount":"0.000316822","fee":"0.000441","targets":[{"addresses":["0x73d0385f4d8e00c5e6504c6030f47bf6212736a8"],"isAddress":true}],"tokens":[],"ethereumSpecific":{"status":-2,"nonce":4,"gasLimit":21000,"gasUsed":21000,"gasPrice":"21000000000"},"page":1},{"descriptor":"0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15","deviceState":"7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f","symbol":"eth","type":"sent","txid":"0x5f3cba8a6dee792594dcce71c5aa39a872bce57cb33e0da8db02d9f2f865806c","blockTime":1494938897,"blockHeight":3716306,"blockHash":"0x7ccd4d3e0758caa38217ba53aeffce99f04fd3baef9ee1a4b77836742decfd22","amount":"0.00124351","fee":"0.00042","targets":[{"addresses":["0x73d0385f4d8e00c5e6504c6030f47bf6212736a8"],"isAddress":true,"amount":"0.00124351"}],"tokens":[],"ethereumSpecific":{"status":-2,"nonce":1,"gasLimit":21000,"gasUsed":21000,"gasPrice":"20000000000"},"page":1},{"descriptor":"0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15","deviceState":"7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f","symbol":"eth","type":"sent","txid":"0xfaae2e7927e97002f15300c6011ca792243cbd57d574db34ccb2a9c18c272b3e","blockTime":1493811343,"blockHeight":3643068,"blockHash":"0x48a016dd2bde9ee285a9bd251de2a848585cac4f4fa31ad699e72df72988b15f","amount":"0","fee":"0.00073568","targets":[],"tokens":[{"type":"sent","name":"Golem Network Token","symbol":"GNT","address":"0xa74476443119a942de498590fe1f2454d7d4ac0d","decimals":18,"amount":"23000000000000000000","from":"0xfa01a39f8abaeb660c3137f14a310d0b414b2a15","to":"0xbc8580e0135a8e82722657f3e024c833d57df912"}],"ethereumSpecific":{"status":-2,"nonce":0,"gasLimit":56784,"gasUsed":36784,"gasPrice":"20000000000"},"page":1},{"descriptor":"0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15","deviceState":"7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f","symbol":"eth","type":"recv","txid":"0x0833ce97c3f4ce6c170c94aff0acfa1cbfd528bf0d3faa06676cad7daddd2e5c","blockTime":1493811263,"blockHeight":3643065,"blockHash":"0x0a7a90d34157253a6363d33f7aaa301cb171b4917908d4e896a4a7e5bf5e9c0a","amount":"0.00239919","fee":"0.00042","targets":[{"addresses":["0x73d0385f4d8e00c5e6504c6030f47bf6212736a8"],"isAddress":true}],"tokens":[],"ethereumSpecific":{"status":-2,"nonce":2,"gasLimit":21000,"gasUsed":21000,"gasPrice":"20000000000"},"page":1},{"descriptor":"0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15","deviceState":"7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f","symbol":"eth","type":"recv","txid":"0xcef7e6fbb7f61df35eb6dd5c26f75c15152f83298d060e4c6b6850a835e2d9cd","blockTime":1493721184,"blockHeight":3637164,"blockHash":"0x3df882d951deeacb1cbbcc9f97bf1c7a8448d2669047a96a8cb2ad1051a5183a","amount":"0","fee":"0.00103568","targets":[],"tokens":[{"type":"recv","name":"Golem Network Token","symbol":"GNT","address":"0xa74476443119a942de498590fe1f2454d7d4ac0d","decimals":18,"amount":"23000000000000000000","from":"0x73d0385f4d8e00c5e6504c6030f47bf6212736a8","to":"0xfa01a39f8abaeb660c3137f14a310d0b414b2a15"}],"ethereumSpecific":{"status":-2,"nonce":1,"gasLimit":56784,"gasUsed":51784,"gasPrice":"20000000000"},"page":1}]
      },
      // eth account, 0 txs
      {
        testName: "eth account, 0 txs",
        transactions: TXS,
        account: {"deviceState":"7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f","index":5,"path":"m/44'/60'/0'/0/5","descriptor":"0xf69619a3dCAA63757A6BA0AF3628f5F6C42c50d2","accountType":"normal","networkType":"ethereum","symbol":"eth","empty":true,"visible":true,"balance":"0","availableBalance":"0","history":{"total":0,"unconfirmed":0},"misc":{"nonce":"0"},"page":{"index":1,"size":25,"total":1}},
        result: [],
      },
];


export const getDiscoveryProcess = [
  {
      testName: "Discovery for 7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f device",
      discoveries: DISCOVERIES,
      device: global.JestMocks.getSuiteDevice({state: "7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f"}),
      result: {"bundleSize": 0, "deviceState": "7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f", "failed": [], "index": 0, "loaded": 39, "networks": ["btc", "btc", "btc", "test", "test", "test", "eth", "txrp"], "status": 4, "total": 35},
  },
  {
      testName: "Discovery for 1dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f device",
      discoveries: DISCOVERIES,
      device: global.JestMocks.getSuiteDevice({state: "1dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f"}),
      result: null,
  },
];


export const observeChanges = [
  {
      testName: "reducerUtils.observeChanges",
      prev: {
        a: 1,
        b: 2,
        c: 3,
    },
      current: {
        a: 1,
        b: 2,
        c: 5,
    },
      filter: undefined,
      result: true,
  },
  {
      testName: "reducerUtils.observeChanges no change",
      prev: {
        a: 1,
        b: 2,
        c: 3,
    },
      current: {
        a: 1,
        b: 2,
        c: 3,
    },
      filter: undefined,
      result: false,
  },
  {
      testName: "reducerUtils.observeChanges deep change with filter",
      prev: {
        a: 1,
        b: 2,
        c: {
            c1: 1,
            c2: 2,
        },
    },
      current: {
        a: 1,
        b: 2,
        c: {
            c1: 1,
            c2: 4,
        },
      },
      filter: {c: ["c2"]},
      result: true,
  },
  {
      testName: "reducerUtils.observeChanges deep change without filter",
      prev: {
        a: 1,
        b: 2,
        c: {
            c1: 1,
            c2: 2,
        },
    },
      current: {
        a: 1,
        b: 2,
        c: {
            c1: 1,
            c2: 4,
        },
      },
      filter: undefined,
      result: true,
  },
  {
    testName: "reducerUtils.observeChanges deep change with filter on wrong field",
    prev: {
      a: 1,
      b: 2,
      c: {
          c1: 1,
          c2: 2,
      },
  },
    current: {
      a: 1,
      b: 2,
      c: {
          c1: 1,
          c2: 4,
      },
    },
    filter: {c: ["c1"]},
    result: false,
  },
];