import type { ElectrumBlockHeader, ElectrumTypes } from '@trezor/blockchain-link-types';

type MockElectrumRecording = {
    // The tip of the server when the transactions were recorded, their confirmations count from it.
    tip: ElectrumBlockHeader;
    transactions: { label: string; height: number; tx: ElectrumTypes.TransactionVerbose }[];
    // The previous transactions of the inputs which are not among the transactions.
    prevTransactions: ElectrumTypes.TransactionVerbose[];
    headers: Record<number, string>;
};

// Public mainnet transactions as ElectrumX 2.0.0 returned them verbose (blockchain.transaction.get
// with verbose true) and the headers of their blocks, recorded from a public server. The fields
// which the transformation of the Electrum worker does not read (asm, desc, input scripts and
// witnesses) are left out.
export const mockElectrumRecording: MockElectrumRecording = {
    tip: {
        hex: '00a05623fe5dc507d0c5e78e545af3fc38141c084dabff292f6901000000000000000000a501f137996ad71797b6a0a25d334296abeca66a4975ffc7c70206f6570942cd6fa8d06af01e021712bd1599',
        height: 971553,
    },
    transactions: [
        {
            label: 'history of the public all-all seed address',
            height: 590093,
            tx: {
                txid: 'fa80a9949f1094119195064462f54d0e0eabd3139becd4514ae635b8c7fe3a46',
                hash: '764ef1574ee2b262e4a84eb575d80461977364590ef424011cb09156db078710',
                hex: '01000000000101360d7a720e95a6068678eb08e91b3a8a4774222c9f34becf57d0dc4329e0a686000000001716001495f41f5c0e0ec2c7fe27f0ac4bd59a5632a40b5fffffffff02d224000000000000160014ece6935b2a5a5b5ff997c87370b16fa10f16441088ba04000000000017a914dfe58cc93d35fb99e15436f47d3bbfce820328068702483045022100f312e8246e6a00d21fd762f12231c5fb7a20094a32940b9a84e28d712a5ced9b02203b9124d7a94aa7eb1e090ceda32e884511d7068b8d47593aa46537900e3e37d40121037e8bf05c6c7223cfba3ea484ecd61ee910ae38609ea89b4a4839beed2186b3fb00000000',
                blockhash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
                version: 1,
                size: 247,
                vsize: 165,
                weight: 658,
                locktime: 0,
                confirmations: 381461,
                time: 1565797979,
                blocktime: 1565797979,
                vin: [
                    {
                        txid: '86a6e02943dcd057cfbe349f2c2274478a3a1be908eb788606a6950e727a0d36',
                        vout: 0,
                        sequence: 4294967295,
                        scriptSig: {},
                        txinwitness: [],
                    },
                ],
                vout: [
                    {
                        value: 9.426e-5,
                        n: 0,
                        scriptPubKey: {
                            asm: '',
                            hex: '0014ece6935b2a5a5b5ff997c87370b16fa10f164410',
                            address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
                            type: 'witness_v0_keyhash',
                        },
                    },
                    {
                        value: 0.00309896,
                        n: 1,
                        scriptPubKey: {
                            asm: '',
                            hex: 'a914dfe58cc93d35fb99e15436f47d3bbfce8203280687',
                            address: '3N6sbjPwa9L911fPxykD3XnGifMdVRMZPV',
                            type: 'scripthash',
                        },
                    },
                ],
            },
        },
        {
            label: 'history of the public all-all seed address',
            height: 590093,
            tx: {
                txid: '7e58757f43015242c0efa29447bea4583336f2358fdff587b52bbe040ad8982a',
                hash: 'bf727841240d3edb93be70c7dcf5f36b426db2113d91731e9f3bfa7e3d95f7a7',
                hex: '01000000000101463afec7b835e64a51d4ec9b13d3ab0e0e4df562440695911194109f94a980fa0000000000ffffffff01611900000000000017a91432a276261d6f084fa46917300b6be8848853211187024730440220200b1192c3d49338678bdb30678fa270720e7ff1de4f45d5340a0cb7fbf8f2de02202457250ae49f088fc9d9663db8c92db4606dc25b098874ed7bb548d3002c346f01210396070f2813933502e907c011ae7ba928683a9c2f0e888dae7ebd2c41120ee6b500000000',
                blockhash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
                version: 1,
                size: 192,
                vsize: 111,
                weight: 441,
                locktime: 0,
                confirmations: 381461,
                time: 1565797979,
                blocktime: 1565797979,
                vin: [
                    {
                        txid: 'fa80a9949f1094119195064462f54d0e0eabd3139becd4514ae635b8c7fe3a46',
                        vout: 0,
                        sequence: 4294967295,
                        scriptSig: {},
                        txinwitness: [],
                    },
                ],
                vout: [
                    {
                        value: 6.497e-5,
                        n: 0,
                        scriptPubKey: {
                            asm: '',
                            hex: 'a91432a276261d6f084fa46917300b6be8848853211187',
                            address: '36JkLACrdxARqXXffZk91V9W6SJvghKaVK',
                            type: 'scripthash',
                        },
                    },
                ],
            },
        },
        {
            label: 'history of the public all-all seed address',
            height: 678095,
            tx: {
                txid: 'e9cb9da499274c2510076cfe50883234cfe0b388ce912b2eb13a506cb1fc58d4',
                hash: '5021896e8e7cc006d44ee5fe8c28df85a5da8001453dcfab156cccaf74756a62',
                hex: '010000000001010e311a28bb7366d0ce2e24955337e2a3c8d68f76fa1dca1b55e3424b585521570000000000feffffff02409c00000000000017a9144208d37d46990b1a62a02cf4423ef956e890b1e0870000000000000000086a06666f6f6261720247304402205fd32f79a2cf55f75c09ffd7a4131cb7502f35124fc67a8c41aba65f5d809ea60220269acdb6038ce14f6098fef8d374390ce56837ac1a17fb928aadb0e15865bc4d01210396070f2813933502e907c011ae7ba928683a9c2f0e888dae7ebd2c41120ee6b500000000',
                blockhash: '0000000000000000000ba5bce3a65fa50d535e4f2ba7821a9dbeeea87258b03c',
                version: 1,
                size: 209,
                vsize: 128,
                weight: 509,
                locktime: 0,
                confirmations: 293459,
                time: 1617760448,
                blocktime: 1617760448,
                vin: [
                    {
                        txid: '572155584b42e3551bca1dfa768fd6c8a3e2375395242eced06673bb281a310e',
                        vout: 0,
                        sequence: 4294967294,
                        scriptSig: {},
                        txinwitness: [],
                    },
                ],
                vout: [
                    {
                        value: 0.0004,
                        n: 0,
                        scriptPubKey: {
                            asm: '',
                            hex: 'a9144208d37d46990b1a62a02cf4423ef956e890b1e087',
                            address: '37iB6TLMcNkGdfhJxXnsJiygXwQ5NnjFfe',
                            type: 'scripthash',
                        },
                    },
                    {
                        value: 0,
                        n: 1,
                        scriptPubKey: { asm: '', hex: '6a06666f6f626172', type: 'nulldata' },
                    },
                ],
            },
        },
        {
            label: 'history of the public all-all seed address',
            height: 678096,
            tx: {
                txid: '213c3a6283af120fcdd3b2e126cc87273bddad119f9184b4eb00ca8b6b683a30',
                hash: '4d5418c122c38541f78834f1203a6ebdf5e72c7d37559f45a000dd7f56e446cb',
                hex: '010000000001020e311a28bb7366d0ce2e24955337e2a3c8d68f76fa1dca1b55e3424b5855215701000000171600149d93c497adf47d6fb8bb5aa777b4cc4d6592047bffffffffd458fcb16c503ab12e2b91ce88b3e0cf34328850fe6c0710254c2799a49dcbe90000000017160014ec8f5355c3412a5f71df11bf980a07418c72a080ffffffff02409c000000000000160014ece6935b2a5a5b5ff997c87370b16fa10f164410f62f00000000000017a914ab86db75da6a1a7588da81f676d591644894d6c8870247304402205071b9f9f46e1ef1baeb61edb8d38ed61d45fa940b3e9852450fc60886cdbeb1022061b245560fc06541df03079d2cded4fa3e4e76a586811494b5eadf4194a166e101210238aa9490613d0cb5faaa14b9e8b4436690c4b273a8ac8846768f49d18e03d5020247304402207a7a7bf0fcc752cf001e463280f69aa10ce4b02184b6105b5157f1fcd8408d4b0220647d19e0a95f1789cde24b8fc1fa28c33152bd99d68dfde5886ffe24d42d444f012103425e5e1bc3a3af2063298d0c13d4ebc590eb0c87ebab877eb8d6058bb022560600000000',
                blockhash: '000000000000000000092a7fab48c894d6f8cee02ff1d6dd8fd28abb3c680d2a',
                version: 1,
                size: 417,
                vsize: 255,
                weight: 1020,
                locktime: 0,
                confirmations: 293458,
                time: 1617762056,
                blocktime: 1617762056,
                vin: [
                    {
                        txid: '572155584b42e3551bca1dfa768fd6c8a3e2375395242eced06673bb281a310e',
                        vout: 1,
                        sequence: 4294967295,
                        scriptSig: {},
                        txinwitness: [],
                    },
                    {
                        txid: 'e9cb9da499274c2510076cfe50883234cfe0b388ce912b2eb13a506cb1fc58d4',
                        vout: 0,
                        sequence: 4294967295,
                        scriptSig: {},
                        txinwitness: [],
                    },
                ],
                vout: [
                    {
                        value: 0.0004,
                        n: 0,
                        scriptPubKey: {
                            asm: '',
                            hex: '0014ece6935b2a5a5b5ff997c87370b16fa10f164410',
                            address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
                            type: 'witness_v0_keyhash',
                        },
                    },
                    {
                        value: 0.00012278,
                        n: 1,
                        scriptPubKey: {
                            asm: '',
                            hex: 'a914ab86db75da6a1a7588da81f676d591644894d6c887',
                            address: '3HKy2PoTgFReqMXrvXn6X6gwAx3Evj9STR',
                            type: 'scripthash',
                        },
                    },
                ],
            },
        },
        {
            label: 'history of the public all-all seed address',
            height: 714488,
            tx: {
                txid: '81d00a47d55b4df0b7a0793533c337493775ceb7f9ae20789325e25051f3374c',
                hash: 'd11a9e2a77f0472bf1ce63f1fe6e4e57016f4ef9885a28febeb29521e156cff5',
                hex: '02000000000101b9e30cbb5aba45dabf1eb99f85f4d982f6cf5985cc6f205d19353730ea4213a40100000000fdffffff01c80100000000000016001443ab95bf07fa315893b235f3350c1e3a4e1e635002473044022005f3cb04f822febfa26ac65d62abac175594b1409369d366212fba2531e0fdb7022052511a742bcb58cf72c13cad63e620ab7c2a50141d3782333e56ff9656da3f6901210396070f2813933502e907c011ae7ba928683a9c2f0e888dae7ebd2c41120ee6b5f7e60a00',
                blockhash: '0000000000000000000acb6c816d8438abdedced3e0f42e20b06043e140c8e71',
                version: 2,
                size: 191,
                vsize: 110,
                weight: 437,
                locktime: 714487,
                confirmations: 257066,
                time: 1639725042,
                blocktime: 1639725042,
                vin: [
                    {
                        txid: 'a41342ea303735195d206fcc8559cff682d9f4859fb91ebfda45ba5abb0ce3b9',
                        vout: 1,
                        sequence: 4294967293,
                        scriptSig: {},
                        txinwitness: [],
                    },
                ],
                vout: [
                    {
                        value: 4.56e-6,
                        n: 0,
                        scriptPubKey: {
                            asm: '',
                            hex: '001443ab95bf07fa315893b235f3350c1e3a4e1e6350',
                            address: 'bc1qgw4et0c8lgc43yajxhen2rq78f8puc6s07hyjp',
                            type: 'witness_v0_keyhash',
                        },
                    },
                ],
            },
        },
        {
            label: 'first payment between people, pay-to-pubkey',
            height: 170,
            tx: {
                txid: 'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16',
                hash: 'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16',
                hex: '0100000001c997a5e56e104102fa209c6a852dd90660a20b2d9c352423edce25857fcd3704000000004847304402204e45e16932b8af514961a1d3a1a25fdf3f4f7732e9d624c6c61548ab5fb8cd410220181522ec8eca07de4860a4acdd12909d831cc56cbbac4622082221a8768d1d0901ffffffff0200ca9a3b00000000434104ae1a62fe09c5f51b13905f07f06b99a2f7159b2225f374cd378d71302fa28414e7aab37397f554a7df5f142c21c1b7303b8a0626f1baded5c72a704f7e6cd84cac00286bee0000000043410411db93e1dcdb8a016b49840f8c53bc1eb68a382e97b1482ecad7b148a6909a5cb2e0eaddfb84ccf9744464f82e160bfa9b8b64f9d4c03f999b8643f656b412a3ac00000000',
                blockhash: '00000000d1145790a8694403d4063f323d499e655c83426834d4ce2f8dd4a2ee',
                version: 1,
                size: 275,
                vsize: 275,
                weight: 1100,
                locktime: 0,
                confirmations: 971384,
                time: 1231731025,
                blocktime: 1231731025,
                vin: [
                    {
                        txid: '0437cd7f8525ceed2324359c2d0ba26006d92d856a9c20fa0241106ee5a597c9',
                        vout: 0,
                        sequence: 4294967295,
                        scriptSig: {},
                        txinwitness: [],
                    },
                ],
                vout: [
                    {
                        value: 10,
                        n: 0,
                        scriptPubKey: {
                            asm: '',
                            hex: '4104ae1a62fe09c5f51b13905f07f06b99a2f7159b2225f374cd378d71302fa28414e7aab37397f554a7df5f142c21c1b7303b8a0626f1baded5c72a704f7e6cd84cac',
                            type: 'pubkey',
                        },
                    },
                    {
                        value: 40,
                        n: 1,
                        scriptPubKey: {
                            asm: '',
                            hex: '410411db93e1dcdb8a016b49840f8c53bc1eb68a382e97b1482ecad7b148a6909a5cb2e0eaddfb84ccf9744464f82e160bfa9b8b64f9d4c03f999b8643f656b412a3ac',
                            type: 'pubkey',
                        },
                    },
                ],
            },
        },
        {
            label: 'coinbase with witness commitment',
            height: 970550,
            tx: {
                txid: 'e14bcad0f16d834063f65dd7536dee6155972300b0f84c7c63a1736374b3c18f',
                hash: '796538ddb64e7e84020236240202831a7bcec5b1078153c4309f8df986ee464d',
                hex: '010000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff630336cf0e1c2f5669614254432f4d696e65642062792068656c6465726a7573742f2cfabe6d6d98b946f2be3396c99f871759bc788b1d4fedd7ae89d6ae50fecf71bcd718bac51000000000000000105d31f70133f5f916b51639d5d4ab060000000000feffffff04aed1ba12000000001976a914fb37342f6275b13936799def06f2eb4c0f20151588ac00000000000000002f6a2d434f52450164db24a662e20bbdf72d1cc6e973dbb2d12897d56a931d9de30a5f313a566775a135cf47d40c0ccd00000000000000002b6a2952534b424c4f434b3a89e0e98786cf957159c1b5dc5860c7e1c15a5e36cb1c84eccd63382b008e0a780000000000000000266a24aa21a9ed787e72464f2836c9833cc47e18f09ab3fcf3003580589b51b61a0315b3bc60c40120000000000000000000000000000000000000000000000000000000000000000035cf0e00',
                blockhash: '0000000000000000000123a71c87706b99e6ee6a0163af3fad98735b34b28fd7',
                version: 1,
                size: 375,
                vsize: 348,
                weight: 1392,
                locktime: 970549,
                confirmations: 1004,
                time: 1791505072,
                blocktime: 1791505072,
                vin: [
                    {
                        coinbase:
                            '0336cf0e1c2f5669614254432f4d696e65642062792068656c6465726a7573742f2cfabe6d6d98b946f2be3396c99f871759bc788b1d4fedd7ae89d6ae50fecf71bcd718bac51000000000000000105d31f70133f5f916b51639d5d4ab060000000000',
                        sequence: 4294967294,
                    },
                ],
                vout: [
                    {
                        value: 3.14233262,
                        n: 0,
                        scriptPubKey: {
                            asm: '',
                            hex: '76a914fb37342f6275b13936799def06f2eb4c0f20151588ac',
                            address: '1PuJjnF476W3zXfVYmJfGnouzFDAXakkL4',
                            type: 'pubkeyhash',
                        },
                    },
                    {
                        value: 0,
                        n: 1,
                        scriptPubKey: {
                            asm: '',
                            hex: '6a2d434f52450164db24a662e20bbdf72d1cc6e973dbb2d12897d56a931d9de30a5f313a566775a135cf47d40c0ccd',
                            type: 'nulldata',
                        },
                    },
                    {
                        value: 0,
                        n: 2,
                        scriptPubKey: {
                            asm: '',
                            hex: '6a2952534b424c4f434b3a89e0e98786cf957159c1b5dc5860c7e1c15a5e36cb1c84eccd63382b008e0a78',
                            type: 'nulldata',
                        },
                    },
                    {
                        value: 0,
                        n: 3,
                        scriptPubKey: {
                            asm: '',
                            hex: '6a24aa21a9ed787e72464f2836c9833cc47e18f09ab3fcf3003580589b51b61a0315b3bc60c4',
                            type: 'nulldata',
                        },
                    },
                ],
            },
        },
        {
            label: 'pay-to-anchor output',
            height: 970550,
            tx: {
                txid: '780cfebe4731ded69000b3983a16ff3377ae48c16289342c2dc68152ce392c25',
                hash: '845bdce11204e146f7e3d370d36424ac5dc9107281f7946bcb3fb11d321e1403',
                hex: '03000000000101fa3ea8e0ab6a011bce7ac72f881fbd4491e9ad81b519d1cfc7d73773083eb28b000000000000000000020a4b010000000000225120c2c6254f077ccaa6ed0f13e037122cbd77c08b0f38f3b97222265a3e1c0b94ee00000000000000000451024e730140885edb88fa1124697389bcfa2575e9f5cce959aca143e897c45d6ecff15b9b805d2d6f78ee4da408823b56a1295d1af2bfc3e7ab2583618eda3eb85e888e26f400000000',
                blockhash: '0000000000000000000123a71c87706b99e6ee6a0163af3fad98735b34b28fd7',
                version: 3,
                size: 175,
                vsize: 124,
                weight: 496,
                locktime: 0,
                confirmations: 1004,
                time: 1791505072,
                blocktime: 1791505072,
                vin: [
                    {
                        txid: '8bb23e087337d7c7cfd119b581ade99144bd1f882fc77ace1b016aabe0a83efa',
                        vout: 0,
                        sequence: 0,
                        scriptSig: {},
                        txinwitness: [],
                    },
                ],
                vout: [
                    {
                        value: 0.00084746,
                        n: 0,
                        scriptPubKey: {
                            asm: '',
                            hex: '5120c2c6254f077ccaa6ed0f13e037122cbd77c08b0f38f3b97222265a3e1c0b94ee',
                            address:
                                'bc1pctrz2nc80n92dmg0z0srwy3vh4mupzc08remju3zyedru8qtjnhq4s4tld',
                            type: 'witness_v1_taproot',
                        },
                    },
                    {
                        value: 0,
                        n: 1,
                        scriptPubKey: {
                            asm: '',
                            hex: '51024e73',
                            address: 'bc1pfeessrawgf',
                            type: 'anchor',
                        },
                    },
                ],
            },
        },
        {
            label: 'OP_RETURN with OP_PUSHDATA1',
            height: 970550,
            tx: {
                txid: 'ed41c80575649e7cef66660f4cedf6d173c01873ff62220463fa4cd2d7ed6c93',
                hash: '942f69b664ed1a8b06d4c3c077ee4c7da0f1ab4ea31ab3c797924dc2757a9f36',
                hex: '02000000000101903b93b959e832becf1010d561d22266af5f5ec8537a75f307c902dde28776940100000000fdffffff025c8e02000000000016001416d73780aae93325aae14a59fb2f01d909e6320d0000000000000000736a4c703078643836633939316231396264323361376435626338303732323339303466393536343462306466636566613636313866376362323761343063353864653637647c6465706f7369746f723d33376b39335266517175586d724a766d69437858477432397254715a6e4b43375a337c024830450221009e797ef9cda3a9e35001079fe79dfec764ff804c5ec499fda9efe6694bd6405f02201e175ab238c80f23c98d478f1c6ee9639c77e8b0e4480246bfcfb84f58af51ef012102ab80c899415e707912899f97c87067defa577a5cfdb481693b09e77004aec61600000000',
                blockhash: '0000000000000000000123a71c87706b99e6ee6a0163af3fad98735b34b28fd7',
                version: 2,
                size: 316,
                vsize: 234,
                weight: 934,
                locktime: 0,
                confirmations: 1004,
                time: 1791505072,
                blocktime: 1791505072,
                vin: [
                    {
                        txid: '947687e2dd02c907f3757a53c85e5faf6622d261d51010cfbe32e859b9933b90',
                        vout: 1,
                        sequence: 4294967293,
                        scriptSig: {},
                        txinwitness: [],
                    },
                ],
                vout: [
                    {
                        value: 0.00167516,
                        n: 0,
                        scriptPubKey: {
                            asm: '',
                            hex: '001416d73780aae93325aae14a59fb2f01d909e6320d',
                            address: 'bc1qzmtn0q92ayejt2hpffvlktcpmyy7vvsd06sefu',
                            type: 'witness_v0_keyhash',
                        },
                    },
                    {
                        value: 0,
                        n: 1,
                        scriptPubKey: {
                            asm: '',
                            hex: '6a4c703078643836633939316231396264323361376435626338303732323339303466393536343462306466636566613636313866376362323761343063353864653637647c6465706f7369746f723d33376b39335266517175586d724a766d69437858477432397254715a6e4b43375a337c',
                            type: 'nulldata',
                        },
                    },
                ],
            },
        },
        {
            label: 'taproot key-path input',
            height: 970550,
            tx: {
                txid: 'bc479f2ff5ddfa6e7c9ef565d382c7d65d5562e03133cfd3d523e66c1aa1db2f',
                hash: 'b9129ddf63e61f1cdfaed315f3e4900dc0586b48a28763e46306693c14f7f1dd',
                hex: '0100000000010153d4039f31fd2da5286e5e27778511ae637353686ea808e6e98ef4f1071c66510000000000ffffffff0120890000000000001976a914be619b5e934596a496a9a0b362f9e53b0078d03e88ac01410122d5f5b584c45e373d8b0fb2c161c370c77e1112215920ed670663bce77c25009555c2a024b2f034e50071966c3ecbb0ddad2479dddcbac44e9c797c9b283d0100000000',
                blockhash: '0000000000000000000123a71c87706b99e6ee6a0163af3fad98735b34b28fd7',
                version: 1,
                size: 154,
                vsize: 103,
                weight: 409,
                locktime: 0,
                confirmations: 1004,
                time: 1791505072,
                blocktime: 1791505072,
                vin: [
                    {
                        txid: '51661c07f1f48ee9e608a86e68537363ae118577275e6e28a52dfd319f03d453',
                        vout: 0,
                        sequence: 4294967295,
                        scriptSig: {},
                        txinwitness: [],
                    },
                ],
                vout: [
                    {
                        value: 0.00035104,
                        n: 0,
                        scriptPubKey: {
                            asm: '',
                            hex: '76a914be619b5e934596a496a9a0b362f9e53b0078d03e88ac',
                            address: '1JMeKJ75K1GZjFfvdPsQpNL4GAXRWgd8Mj',
                            type: 'pubkeyhash',
                        },
                    },
                ],
            },
        },
        {
            label: 'pay-to-pubkey-hash input',
            height: 970550,
            tx: {
                txid: 'c3c339e49c5a5eb9d6346c20be1eccaba53d835049d3ce79b8c7804e3baf302d',
                hash: 'c3c339e49c5a5eb9d6346c20be1eccaba53d835049d3ce79b8c7804e3baf302d',
                hex: '0200000001c8777a8881f2b4b5ff7db3473a846a43de7c6466f736ec4666e9427992598303040000006a47304402200dd5e5de71d97e9d731f76b8f4e1817f5f55cc0092d1486c0a45401dcc9ffa2a022011edaf0c820c61f81e88d66a00bee323ee688ab2c7d7bd134f862bb3f1aa602f012102b4f73c7af7acd2f13bc88c969ee1a70d89cac4a15bc376ba6a5ab57990c9d37effffffff04007d000000000000160014632c61b9c41791688ac7c1932237da881b7f6954687009000000000016001406863ec026b1144d8691b9c366f526cbbe47dcacfcb12e00000000001976a91413ca897fb58b4dc246c4eb57fdd6505b0076e8cd88aca44dc20b000000001976a9146fb6a5971fe67339ff7ea8aebde72713f74f2c9c88ac00000000',
                blockhash: '0000000000000000000123a71c87706b99e6ee6a0163af3fad98735b34b28fd7',
                version: 2,
                size: 287,
                vsize: 287,
                weight: 1148,
                locktime: 0,
                confirmations: 1004,
                time: 1791505072,
                blocktime: 1791505072,
                vin: [
                    {
                        txid: '038359927942e96646ec36f766647cde436a843a47b37dffb5b4f281887a77c8',
                        vout: 4,
                        sequence: 4294967295,
                        scriptSig: {},
                        txinwitness: [],
                    },
                ],
                vout: [
                    {
                        value: 0.00032,
                        n: 0,
                        scriptPubKey: {
                            asm: '',
                            hex: '0014632c61b9c41791688ac7c1932237da881b7f6954',
                            address: 'bc1qvvkxrwwyz7gk3zk8cxfjyd763qdh762570tw5m',
                            type: 'witness_v0_keyhash',
                        },
                    },
                    {
                        value: 0.006186,
                        n: 1,
                        scriptPubKey: {
                            asm: '',
                            hex: '001406863ec026b1144d8691b9c366f526cbbe47dcac',
                            address: 'bc1qq6rraspxky2ymp53h8pkdafxewly0h9v8mzj7d',
                            type: 'witness_v0_keyhash',
                        },
                    },
                    {
                        value: 0.0306022,
                        n: 2,
                        scriptPubKey: {
                            asm: '',
                            hex: '76a91413ca897fb58b4dc246c4eb57fdd6505b0076e8cd88ac',
                            address: '12oeUAqKh2VpEgz2MQbsM5nWiCj4ZiMEaE',
                            type: 'pubkeyhash',
                        },
                    },
                    {
                        value: 1.97283236,
                        n: 3,
                        scriptPubKey: {
                            asm: '',
                            hex: '76a9146fb6a5971fe67339ff7ea8aebde72713f74f2c9c88ac',
                            address: '1BBgopSSV131UmjN9AU9MSrnXoev3XZZhX',
                            type: 'pubkeyhash',
                        },
                    },
                ],
            },
        },
        {
            label: 'pay-to-script-hash input',
            height: 970550,
            tx: {
                txid: '53f94e566783e7ae5521581672393cd779c272bc0b2c4db6b60b6658daed96d8',
                hash: 'f818793e5a53f90649cde4591c25a423788d405d9b6fdd950f7cdbbf2ef8aa1b',
                hex: '0100000000010147e36bb016d9733a2bd5ced07f6726315a3ccffeabdc92799589808b9fc95f8400000000232200204da47981ba68ab7ea07c93f891a071402735297face889108558935830b82625fdffffff0293b0261d0000000017a914040572f196381a9a41e27a709760148f3b88fcd787a0b195360000000017a914491fc45b76a244065dc7a85864ff380eb394a517870400483045022100a8f99a583d233c172b10fc799d0cbd942b050d13d6471795cc35cb5444aab82102202a59d5af45e1fbf3e808236276b0e6a7a4e03a0fa8d00a64cf8c940a446220070147304402201119f12032e09f93c2a7c9cd8936691a0bb8394b68e2210d920dc8c4c063201502206b1e14969fa54cc338f7cdbf8a4ff8cf6f3acb25e40fa3bf2aeca06502a70668016952210359acdc9d4b78cce6625bb523e16f993bf51e9f374f1acca7d9ef9012d9310e7f21025664c202b4507fd626b41ae1c4a638f4e1fb0e53c697937d30af0148f2f1ddd02103e6dbb3f4f1c2d2cff15ea09c3f07517e12b8f9c0015ea8377f149bc8f16e732353ae00000000',
                blockhash: '0000000000000000000123a71c87706b99e6ee6a0163af3fad98735b34b28fd7',
                version: 1,
                size: 405,
                vsize: 214,
                weight: 855,
                locktime: 0,
                confirmations: 1004,
                time: 1791505072,
                blocktime: 1791505072,
                vin: [
                    {
                        txid: '845fc99f8b8089957992dcabfecf3c5a3126677fd0ced52b3a73d916b06be347',
                        vout: 0,
                        sequence: 4294967293,
                        scriptSig: {},
                        txinwitness: [],
                    },
                ],
                vout: [
                    {
                        value: 4.89074835,
                        n: 0,
                        scriptPubKey: {
                            asm: '',
                            hex: 'a914040572f196381a9a41e27a709760148f3b88fcd787',
                            address: '324H9uyTV9bPgAVgmdJNxPKKKZmowk5CYq',
                            type: 'scripthash',
                        },
                    },
                    {
                        value: 9.1578,
                        n: 1,
                        scriptPubKey: {
                            asm: '',
                            hex: 'a914491fc45b76a244065dc7a85864ff380eb394a51787',
                            address: '38MfJkxPkpwsZxkyfESwjdaKBdXrV8DpWr',
                            type: 'scripthash',
                        },
                    },
                ],
            },
        },
    ],
    prevTransactions: [
        {
            txid: '86a6e02943dcd057cfbe349f2c2274478a3a1be908eb788606a6950e727a0d36',
            hash: 'a243a4cc0c8456aab8775e2ea8eceaec5c4cee9745e4e4bf98c5cfd09fc7fafb',
            hex: '01000000000101af445f684464ab8a469f0ab8911941bad6a968542dbe73c44f2a39aa994964650000000017160014540c8078146facd9a070f824077baf0654470ab9ffffffff0200e004000000000017a9147054be57c42a7d80f613e8741fe8b1376fa4126d87d23205000000000017a91433d9eae722e2c57fde582d3d4133d2c603633aec8702483045022100c266d30a7d47b9d9f5fa5fc7ea3e4f77e656e4f4f579f4872a604a0ff10c0587022070774f5f5a51b95185a4d440ea080c4ad2e97ed7f57feaa3e1db6849a1fbd5af012103340ae258c450750465ac0ebc79ec2b3f1b779f374589be751da16b39d0707e4e00000000',
            blockhash: '0000000000000000000cd35cd5726fe24f0c550fcc26b5e0b23fe9aca99f32a6',
            version: 1,
            size: 248,
            vsize: 166,
            weight: 662,
            locktime: 0,
            confirmations: 382206,
            time: 1565365802,
            blocktime: 1565365802,
            vin: [
                {
                    txid: '65644999aa392a4fc473be2d5468a9d6ba411991b80a9f468aab6444685f44af',
                    vout: 0,
                    sequence: 4294967295,
                    scriptSig: {},
                    txinwitness: [],
                },
            ],
            vout: [
                {
                    value: 0.00319488,
                    n: 0,
                    scriptPubKey: {
                        asm: '',
                        hex: 'a9147054be57c42a7d80f613e8741fe8b1376fa4126d87',
                        address: '3Bvy87TmQhhSBqfiCBh8w5yPx6usiDM8SY',
                        type: 'scripthash',
                    },
                },
                {
                    value: 0.0034069,
                    n: 1,
                    scriptPubKey: {
                        asm: '',
                        hex: 'a91433d9eae722e2c57fde582d3d4133d2c603633aec87',
                        address: '36RBSWLeSn7ycDCu1iHqiHMzLnncjLoHnM',
                        type: 'scripthash',
                    },
                },
            ],
        },
        {
            txid: '572155584b42e3551bca1dfa768fd6c8a3e2375395242eced06673bb281a310e',
            hash: 'c5f1f13eef09b19ecf0f65108467fff1072b416bd04857d4bd62fdc4f064e1ba',
            hex: '010000000001015be980e504c712e76501e8407648abb4bd9382aa2dfc5923d33a039365f24611010000001716001460a958d4290e08ef627a5684bd9fbc550f3892c8ffffffff0250c3000000000000160014ece6935b2a5a5b5ff997c87370b16fa10f1644109e7e00000000000017a914d049c9f2551518af83b18a04e347c27059a5c3958702483045022100a44cc3d9cd66abb218826ddc51105abf546c898b83eea01156f26aa30cb02cfb02206786579fbcca9c8d79d3d7b5080b9db7daf309848dd4bce43bd46050649c78e4012103f7719e65da8cd0a09eb7c4b33a8fbeff60d243e68dc34ad9e8abe8796f9f96d000000000',
            blockhash: '0000000000000000000ba5bce3a65fa50d535e4f2ba7821a9dbeeea87258b03c',
            version: 1,
            size: 247,
            vsize: 165,
            weight: 658,
            locktime: 0,
            confirmations: 293459,
            time: 1617760448,
            blocktime: 1617760448,
            vin: [
                {
                    txid: '1146f26593033ad32359fc2daa8293bdb4ab487640e80165e712c704e580e95b',
                    vout: 1,
                    sequence: 4294967295,
                    scriptSig: {},
                    txinwitness: [],
                },
            ],
            vout: [
                {
                    value: 0.0005,
                    n: 0,
                    scriptPubKey: {
                        asm: '',
                        hex: '0014ece6935b2a5a5b5ff997c87370b16fa10f164410',
                        address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
                        type: 'witness_v0_keyhash',
                    },
                },
                {
                    value: 0.00032414,
                    n: 1,
                    scriptPubKey: {
                        asm: '',
                        hex: 'a914d049c9f2551518af83b18a04e347c27059a5c39587',
                        address: '3LgLsPDoveVvp1WUZNRrg16TMdtG6Ad84e',
                        type: 'scripthash',
                    },
                },
            ],
        },
        {
            txid: 'a41342ea303735195d206fcc8559cff682d9f4859fb91ebfda45ba5abb0ce3b9',
            hash: 'b7e2e32e8580bdf101117963585fb2cfe724eefba27e8c12c9107f0e23dc7b20',
            hex: '010000000001017efbbcf757c858805452d96ed82080ae7c789ed0481debb9699a9e5f962ec4d63e000000000000000002f6ab0000000000001600144fb0bdcafb28e7a771cdc32d1c5f38da290b5af43602000000000000160014ece6935b2a5a5b5ff997c87370b16fa10f16441002483045022100dda1badb81c9171215dce735685be2728ecf545b5a10db06e88205595a2813ce0220436dcce1190273601bfec297fc288622a8e2ae306aeeb0c48052f08a7650123a0121038f4fe8f8cf97e32cc4af0b8f4cc02e8cad2c1477eab00dcbb37e44f59939422400000000',
            blockhash: '00000000000000000000d761e44feb99d03e42ead4a82eeb870cce1077ca4a2a',
            version: 1,
            size: 223,
            vsize: 141,
            weight: 562,
            locktime: 0,
            confirmations: 257096,
            time: 1639707387,
            blocktime: 1639707387,
            vin: [
                {
                    txid: 'd6c42e965f9e9a69b9eb1d48d09e787cae8020d86ed952548058c857f7bcfb7e',
                    vout: 62,
                    sequence: 0,
                    scriptSig: {},
                    txinwitness: [],
                },
            ],
            vout: [
                {
                    value: 0.00044022,
                    n: 0,
                    scriptPubKey: {
                        asm: '',
                        hex: '00144fb0bdcafb28e7a771cdc32d1c5f38da290b5af4',
                        address: 'bc1qf7ctmjhm9rn6wuwdcvk3checmg5skkh53a2ht5',
                        type: 'witness_v0_keyhash',
                    },
                },
                {
                    value: 5.66e-6,
                    n: 1,
                    scriptPubKey: {
                        asm: '',
                        hex: '0014ece6935b2a5a5b5ff997c87370b16fa10f164410',
                        address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
                        type: 'witness_v0_keyhash',
                    },
                },
            ],
        },
        {
            txid: '0437cd7f8525ceed2324359c2d0ba26006d92d856a9c20fa0241106ee5a597c9',
            hash: '0437cd7f8525ceed2324359c2d0ba26006d92d856a9c20fa0241106ee5a597c9',
            hex: '01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0704ffff001d0134ffffffff0100f2052a0100000043410411db93e1dcdb8a016b49840f8c53bc1eb68a382e97b1482ecad7b148a6909a5cb2e0eaddfb84ccf9744464f82e160bfa9b8b64f9d4c03f999b8643f656b412a3ac00000000',
            blockhash: '000000008d9dc510f23c2657fc4f67bea30078cc05a90eb89e84cc475c080805',
            version: 1,
            size: 134,
            vsize: 134,
            weight: 536,
            locktime: 0,
            confirmations: 971545,
            time: 1231473279,
            blocktime: 1231473279,
            vin: [{ coinbase: '04ffff001d0134', sequence: 4294967295 }],
            vout: [
                {
                    value: 50,
                    n: 0,
                    scriptPubKey: {
                        asm: '',
                        hex: '410411db93e1dcdb8a016b49840f8c53bc1eb68a382e97b1482ecad7b148a6909a5cb2e0eaddfb84ccf9744464f82e160bfa9b8b64f9d4c03f999b8643f656b412a3ac',
                        type: 'pubkey',
                    },
                },
            ],
        },
        {
            txid: '8bb23e087337d7c7cfd119b581ade99144bd1f882fc77ace1b016aabe0a83efa',
            hash: '2446d0284a489991f140a40e1a59014840d9de44ccf88278ee459963c2a8d912',
            hex: '030000000001018215124483869ed55963cb88f48ebed6e52de23720b60489b00fdebdd7957291000000000000000000020a4b0100000000002251204de42171e8c21633f715b108315a96e4ccef1991af4aa90ad26aba7d3e57a97b00000000000000000451024e73014068e7a06c4cc7d08c9f1888d68d7564bdd34b4faef31ba7b39e55f873e01aa247e63a7ef6b8773005c9f7224bd5c598956b13471fafdbb4eefd582c09faf3a67000000000',
            blockhash: '00000000000000000001c96938404a2d973d69172f079909d3e050daf3c83c02',
            version: 3,
            size: 175,
            vsize: 124,
            weight: 496,
            locktime: 0,
            confirmations: 1005,
            time: 1791504483,
            blocktime: 1791504483,
            vin: [
                {
                    txid: '917295d7bdde0fb08904b62037e22de5d6be8ef488cb6359d59e868344121582',
                    vout: 0,
                    sequence: 0,
                    scriptSig: {},
                    txinwitness: [],
                },
            ],
            vout: [
                {
                    value: 0.00084746,
                    n: 0,
                    scriptPubKey: {
                        asm: '',
                        hex: '51204de42171e8c21633f715b108315a96e4ccef1991af4aa90ad26aba7d3e57a97b',
                        address: 'bc1pfhjzzu0gcgtr8ac4kyyrzk5kunxw7xv34a92jzkjd2a860jh49as6evlg5',
                        type: 'witness_v1_taproot',
                    },
                },
                {
                    value: 0,
                    n: 1,
                    scriptPubKey: {
                        asm: '',
                        hex: '51024e73',
                        address: 'bc1pfeessrawgf',
                        type: 'anchor',
                    },
                },
            ],
        },
        {
            txid: '947687e2dd02c907f3757a53c85e5faf6622d261d51010cfbe32e859b9933b90',
            hash: '4853a2b2df9048fd696b41eedb309d5de91a4851250ff22b0c86934e70fe1c4a',
            hex: '0200000000010188087ff72b68e417e47849931824d255bcd9fd463e625d8878e05025998081210200000000fdffffff03b439080000000000160014c8b3a14f8c0aa9b0e765fa722a64d8791c0d5d443492020000000000160014e14411e964b1fa5182b9d288bd7e202032a042d846e3500f00000000160014f60834ef165253c571b11ce9fa74e46692fc5ec102483045022100c6aaa8b28b373dc4631ed9e9c4ba8a9bbd21a6805593a146608c0504a563817d022072bcff79849019c0028854bf84ace5c6574e15999016eb45945c04dc1dc365790121026e5628506ecd33242e5ceb5fdafe4d3066b5c0f159b3c05a621ef65f177ea28600000000',
            blockhash: '0000000000000000000123a71c87706b99e6ee6a0163af3fad98735b34b28fd7',
            version: 2,
            size: 254,
            vsize: 172,
            weight: 686,
            locktime: 0,
            confirmations: 1004,
            time: 1791505072,
            blocktime: 1791505072,
            vin: [
                {
                    txid: '218180992550e078885d623e46fdd9bc55d22418934978e417e4682bf77f0888',
                    vout: 2,
                    sequence: 4294967293,
                    scriptSig: {},
                    txinwitness: [],
                },
            ],
            vout: [
                {
                    value: 0.0053906,
                    n: 0,
                    scriptPubKey: {
                        asm: '',
                        hex: '0014c8b3a14f8c0aa9b0e765fa722a64d8791c0d5d44',
                        address: 'bc1qeze6znuvp25mpem9lfez5exc0ywq6h2yzw7uey',
                        type: 'witness_v0_keyhash',
                    },
                },
                {
                    value: 0.001685,
                    n: 1,
                    scriptPubKey: {
                        asm: '',
                        hex: '0014e14411e964b1fa5182b9d288bd7e202032a042d8',
                        address: 'bc1qu9zpr6tyk8a9rq4e62yt6l3qyqe2qskcktx764',
                        type: 'witness_v0_keyhash',
                    },
                },
                {
                    value: 2.56959302,
                    n: 2,
                    scriptPubKey: {
                        asm: '',
                        hex: '0014f60834ef165253c571b11ce9fa74e46692fc5ec1',
                        address: 'bc1q7cyrfmck2ffu2ud3rn5l5a8yv6f0chkp0zpemf',
                        type: 'witness_v0_keyhash',
                    },
                },
            ],
        },
        {
            txid: '51661c07f1f48ee9e608a86e68537363ae118577275e6e28a52dfd319f03d453',
            hash: '4d484bcac1c466014b2667190439bd0afc2323ca62ba973cb843f549ffbfb5b2',
            hex: '01000000000101a8b17da58d8782821ba27d5ffac3d7ad757a3c32818267adf81af071ed2d5c7f0000000000ffffffff01698b0000000000002251201380acb27914e6949d7114d5eef8b2d938309b1ae8ab2ab7c65dc0e9743c33900420308ab174fd7ae71b88623c246d4023bc638ba0767bd684089238a1c242ce250a47304402200e9b7bbd1269a6c4527ecb2547c216687ae20f56782d8f32224c3f6676db8e5102204071c0300b1e722b2fd31ce2cae4d74011535a75c41ecad334f9eb0eabb09f630147304402200cf86d6f9284dd4158fbb46391ea26459a52e90e4d8f35f8c20e2959d1ee5124022017197fd0ded0adb71114f651cd0da6dad5abc6f1b2524b4d82a75b296dc61bb601822103b96bd97ba5242eb83d87900b3c9c90eacf8b699d8267e46a4f41c2356da0078dac6476a914a352f69bb12ad16122f18c39cd70f094eba0d30588ad0324d00eb167210358eb3ee623227c5b50cd2de82f211fa9d66249053d9f635c1aac07f4c24a5248ad82012088a9145b0ce7f72b2a46201f36c2c354456b5da99eccf8876800000000',
            blockhash: '0000000000000000000187d7253203d6602728da8416e36e3760a7638abbcc7e',
            version: 1,
            size: 405,
            vsize: 172,
            weight: 687,
            locktime: 0,
            confirmations: 1021,
            time: 1791493625,
            blocktime: 1791493625,
            vin: [
                {
                    txid: '7f5c2ded71f01af8ad678281323c7a75add7c3fa5f7da21b8282878da57db1a8',
                    vout: 0,
                    sequence: 4294967295,
                    scriptSig: {},
                    txinwitness: [],
                },
            ],
            vout: [
                {
                    value: 0.00035689,
                    n: 0,
                    scriptPubKey: {
                        asm: '',
                        hex: '51201380acb27914e6949d7114d5eef8b2d938309b1ae8ab2ab7c65dc0e9743c3390',
                        address: 'bc1pzwq2evneznnff8t3zn27a79jmyurpxc6az4j4d7xthqwjapuxwgq7esfy6',
                        type: 'witness_v1_taproot',
                    },
                },
            ],
        },
        {
            txid: '038359927942e96646ec36f766647cde436a843a47b37dffb5b4f281887a77c8',
            hash: '038359927942e96646ec36f766647cde436a843a47b37dffb5b4f281887a77c8',
            hex: '0200000001cc3e9aaa7c4bd5461cf54c3fe1d19783333e1eb5200d2438dc506d3df4d21078070000006a47304402203a3735bb270853b2ceab661f2f4f3ebde8df65756315aaf320860439ca37e9360220718a5e3ef2bc120cbd01381b2e108d5f8bead317cbe23b609a725f181b2cd89c0121037178ab7ea90bf17b6942b940a257c2a9c40167d6f6e494e06ef4a0e228e5a4f8ffffffff053c3e00000000000016001432edf16b1572a22dfb7f6d0b4a16e7c62c6664c1b6f5020000000000160014977cbfe2857f1c626599b64c18c2ce75dd1b2847b0151600000000001600144d672daf1db030d3592444fa384086d169b098244801210000000000160014025638f1601fb4d41833094473cda596b264c16838f6fa0b000000001976a914d2b1254902e308b80ea4d46738005b367952581088ac00000000',
            blockhash: '00000000000000000001c96938404a2d973d69172f079909d3e050daf3c83c02',
            version: 2,
            size: 315,
            vsize: 315,
            weight: 1260,
            locktime: 0,
            confirmations: 1005,
            time: 1791504483,
            blocktime: 1791504483,
            vin: [
                {
                    txid: '7810d2f43d6d50dc38240d20b51e3e338397d1e13f4cf51c46d54b7caa9a3ecc',
                    vout: 7,
                    sequence: 4294967295,
                    scriptSig: {},
                    txinwitness: [],
                },
            ],
            vout: [
                {
                    value: 0.00015932,
                    n: 0,
                    scriptPubKey: {
                        asm: '',
                        hex: '001432edf16b1572a22dfb7f6d0b4a16e7c62c6664c1',
                        address: 'bc1qxtklz6c4w23zm7mld59559h8cckxvexp2ssm6s',
                        type: 'witness_v0_keyhash',
                    },
                },
                {
                    value: 0.00193974,
                    n: 1,
                    scriptPubKey: {
                        asm: '',
                        hex: '0014977cbfe2857f1c626599b64c18c2ce75dd1b2847',
                        address: 'bc1qja7tlc590uwxyevekexp3skwwhw3k2z8e7j5hs',
                        type: 'witness_v0_keyhash',
                    },
                },
                {
                    value: 0.01447344,
                    n: 2,
                    scriptPubKey: {
                        asm: '',
                        hex: '00144d672daf1db030d3592444fa384086d169b09824',
                        address: 'bc1qf4njmtcakqcdxkfygnarssyx695mpxpy2gegcl',
                        type: 'witness_v0_keyhash',
                    },
                },
                {
                    value: 0.02163016,
                    n: 3,
                    scriptPubKey: {
                        asm: '',
                        hex: '0014025638f1601fb4d41833094473cda596b264c168',
                        address: 'bc1qqftr3utqr76dgxpnp9z88nd9j6exfstg5pt7j0',
                        type: 'witness_v0_keyhash',
                    },
                },
                {
                    value: 2.00996408,
                    n: 4,
                    scriptPubKey: {
                        asm: '',
                        hex: '76a914d2b1254902e308b80ea4d46738005b367952581088ac',
                        address: '1LD37acnasCswbdzLU5n4xJUhMrDbSubXV',
                        type: 'pubkeyhash',
                    },
                },
            ],
        },
        {
            txid: '845fc99f8b8089957992dcabfecf3c5a3126677fd0ced52b3a73d916b06be347',
            hash: '9f80d863565f6d75fee4ca307117a55403ebcf2f967dad6f89784cc0bf4c82ad',
            hex: '0100000000010174c0cf3b29c87097fe9091ec437d8e2ae64aa2b4b994a85d2def0ed2be38dce201000000232200204da47981ba68ab7ea07c93f891a071402735297face889108558935830b82625fdffffff04318cbc530000000017a914040572f196381a9a41e27a709760148f3b88fcd78774bcd293000000001976a914e0babfef186005e84643dc03d5a16424d65e33fb88ac09a2a59d0000000017a914040572f196381a9a41e27a709760148f3b88fcd787f65e701c0100000017a914040572f196381a9a41e27a709760148f3b88fcd78704004730440220713684d4eba3db0a043ae5ceb5dbb6add722c12fa9290c82c27b9f42bbe44e7002203e908cac6b21a1b970276b04742a3cc5512f2377931f0535e17f207f46a1063b0147304402202f61aeb375b46b683f017a569555ce23a71b41a4e51c242528715445add1fa0302203a1e0f490387453f7d3dcfeb69a528aa826b70bd12b74b9cd515a6a4737b1b7b016952210359acdc9d4b78cce6625bb523e16f993bf51e9f374f1acca7d9ef9012d9310e7f21025664c202b4507fd626b41ae1c4a638f4e1fb0e53c697937d30af0148f2f1ddd02103e6dbb3f4f1c2d2cff15ea09c3f07517e12b8f9c0015ea8377f149bc8f16e732353ae00000000',
            blockhash: '00000000000000000000e9d000f01d1850128f5d5c4760da53bd3944f85364ee',
            version: 1,
            size: 470,
            vsize: 280,
            weight: 1118,
            locktime: 0,
            confirmations: 1033,
            time: 1791487674,
            blocktime: 1791487674,
            vin: [
                {
                    txid: 'e2dc38bed20eef2d5da894b9b4a24ae62a8e7d43ec9190fe9770c8293bcfc074',
                    vout: 1,
                    sequence: 4294967293,
                    scriptSig: {},
                    txinwitness: [],
                },
            ],
            vout: [
                {
                    value: 14.04865585,
                    n: 0,
                    scriptPubKey: {
                        asm: '',
                        hex: 'a914040572f196381a9a41e27a709760148f3b88fcd787',
                        address: '324H9uyTV9bPgAVgmdJNxPKKKZmowk5CYq',
                        type: 'scripthash',
                    },
                },
                {
                    value: 24.80061556,
                    n: 1,
                    scriptPubKey: {
                        asm: '',
                        hex: '76a914e0babfef186005e84643dc03d5a16424d65e33fb88ac',
                        address: '1MVG5a32pzBR4r5dMd8mAucDo3vhFMtSvo',
                        type: 'pubkeyhash',
                    },
                },
                {
                    value: 26.44877833,
                    n: 2,
                    scriptPubKey: {
                        asm: '',
                        hex: 'a914040572f196381a9a41e27a709760148f3b88fcd787',
                        address: '324H9uyTV9bPgAVgmdJNxPKKKZmowk5CYq',
                        type: 'scripthash',
                    },
                },
                {
                    value: 47.72093686,
                    n: 3,
                    scriptPubKey: {
                        asm: '',
                        hex: 'a914040572f196381a9a41e27a709760148f3b88fcd787',
                        address: '324H9uyTV9bPgAVgmdJNxPKKKZmowk5CYq',
                        type: 'scripthash',
                    },
                },
            ],
        },
    ],
    headers: {
        '170': '0100000055bd840a78798ad0da853f68974f3d183e2bd1db6a842c1feecf222a00000000ff104ccb05421ab93e63f8c3ce5c2c2e9dbb37de2764b3a3175c8166562cac7d51b96a49ffff001d283e9e70',
        '590093':
            '00e0ff3fe010476f184490ad600c97ba3c665ac48ea174e965bf190000000000000000002c27f6c44c445ac1bd63936c616549514c61495852d2b5e1eae7b8ca140f4d8c5b2e545d39301c17b51f05ab',
        '678095':
            '00008020f440520986d6adb059255088e09daad7c117359fe0e90a00000000000000000019ed31011b181311c89b3f76af5ebc2bff327e9dea33667036776412e06e8a05c0106d60482a0c1723c5989b',
        '678096':
            '000000203cb05872a8eebe9d1a82a72b4f5e530da55fa6e3bca50b00000000000000000000e565a49ff4cdfed10ed8a7c42c7fcb5aca9648702034b09e3fd758b9b39faa08176d60482a0c1701173594',
        '714488':
            '04e0ff2fa23cc714c561de97ce13f23a354ec2b5062f2cd29e680b000000000000000000f7bf90f2bdef77e99b8fe214eab3efc1c355f61aa12152040b8ed310d076e4aaf237bc611fa20b17a8b9e40f',
        '970550':
            '00801420023cc8f3da50e0d30999072f17693d972d4a403869c901000000000000000000b2fc636544f1ad1d8d2482dd82d2570465db2b37a95135c9f974e95dd322067ab032c86af01e021736b758ea',
    },
};
