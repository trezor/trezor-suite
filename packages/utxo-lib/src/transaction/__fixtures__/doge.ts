export default {
    valid: [
        {
            description: 'Doge transaction with regular inputs/outputs',
            id: '8a012ab301b3f6b5a4defc0f52035e9253d82248886e828ed7471545eb1ec089',
            hash: '89c01eeb451547d78e826e884822d853925e03520ffcdea4b5f6b301b32a018a',
            hex: '010000000102c77cec7ae31e747a861e70ef2ad113d1b2e7d4431eb5e20468efed742af1b7010000006a47304402207bcf90586648819e1a988ddb5078f4ddd643a22d3c7cafdc7b9ba45ea3c9242802201af513f8271d20d79b571e4cb2a0c07ec945a45f066a0083dd83d73ba3f789df012102bba0c425dd0b1103079fe551b612578136dae085e9ca9390124a257891af34bcfeffffff02be6c966fa45d03001976a914d420011b6bb2d763a639326f14a84f52ac93fd2188ac007efe67260400001976a9143a2ea4e463767dac5c94b7ff16bab05ded8f455188ac79472800',
            raw: {
                version: 1,
                locktime: 2639737,
                ins: [
                    {
                        hash: '02c77cec7ae31e747a861e70ef2ad113d1b2e7d4431eb5e20468efed742af1b7',
                        index: 1,
                        data: '47304402207bcf90586648819e1a988ddb5078f4ddd643a22d3c7cafdc7b9ba45ea3c9242802201af513f8271d20d79b571e4cb2a0c07ec945a45f066a0083dd83d73ba3f789df012102bba0c425dd0b1103079fe551b612578136dae085e9ca9390124a257891af34bc',
                        sequence: 4294967294,
                    },
                ],
                outs: [
                    {
                        value: '947385758280894',
                        data: '76a914d420011b6bb2d763a639326f14a84f52ac93fd2188ac',
                    },
                    {
                        value: '4563000000000',
                        data: '76a9143a2ea4e463767dac5c94b7ff16bab05ded8f455188ac',
                    },
                ],
            },
            coinbase: false,
            virtualSize: 225,
            weight: 900,
        },
        {
            description: 'Doge transaction with big inputs/outputs',
            id: '0a4cb7d5c27455333701f0e53812e4be56a0272ad7f168279acfed7b065ee118',
            hash: '18e15e067bedcf9a2768f1d72a27a056bee41238e5f00137335574c2d5b74c0a',
            hex: '0100000009f207139eede9036fbffa7c38c2fa7b31b7f8b05e506469e2a864e6ba4f650309030000006a4730440220518834f033ddbde0f8cd7364cf4f63986a5d351bd6902678e2b155bd64868dcd022065380ef6896fadb76af9cabbac0cb55f2450c3bf231ea5c33d53852feda7a230012102afac6ae55a124be8b3cf7c6c41b434ad39e19666133c9a7eccc245de2d87b2a8ffffffff738a37e5c5e8b47c6fb3626429d7c283454d5d0eb60345ab391d7454e7af2841b50000006a47304402202bf2000d4caf630c099ed36d4a946fee06145f8ee01a6b95db9bd6e6f28c21d402202a398ea73f0a927672a0504af35c6ccde9a9f9b72ad0043247f9779602cf4e8c01210306ca53dc026ca1743f4a5a975433f834b008631bf0440fbf08ed998803d0e76dffffffff0eb391629d18e49d76efc8d381771dfb10f8349ff3c1abb374f6bb138d3bcee5000000006b483045022100bf49f4ce04ecc1c1980369621915a738bb3715ee34f3750540d3998637072a1302206f463374e24037e142b2623aade22cb20cbbda6748bf2d67eb30e6dcc9e4d4b6012103246d027b055891843aaf55eb0dbe625d3a51bdb894a48e6959566bec74458fefffffffff4c5d66d28e98394c0eb913b9d53302d1b82c0417c7a4936a46e4e4babb668a23390000006a473044022038f33042c6bdf95ff0661b9350e8302bc2c9c2361f634e74205b729c5c384dbb02204709a5a07cfdfe195026a539445cbfccf19bc2c5a2b7d8ac1cf145547d814c2201210205615a3cf8b06580b5309121dfd5420ee638dd5efc3a3a4e228573cf95ea2a02ffffffff4c5d66d28e98394c0eb913b9d53302d1b82c0417c7a4936a46e4e4babb668a23f90300006b483045022100a866d3cf574b6378797231fb5f2cc450d2ca546fb6c7f43fba16362c6269eb500220290840dba0b66686bd07b451e9dfc58ddf5c26fb459b37326ad9833236a083c701210220e4154c356afa89b3d67109b8b73cef0a5fd1ac59486e1f8e81d25fbc27c456ffffffffc9b0c41a4a8c8b2d2541b71325490f0f3431a69284a4bfe8d7d3081d37b3d640ea0200006a47304402206ecfa69c0fbb21344d9eeccdaafc8f09b1fbff5405a2d66a6303f03269e82f3e022028ebe103701ca8271b9c168fc7fd073b5b6a2669f166990b63a21580536871920121034e5a9689ac5f1862c3e886a792788efd30316d72a8a18907102d80211ef8b57afffffffffb7ef969f25ec90515ea6bfa5e2e4d6e3f3e8c325666d32a64f671ab5d2c810c190700006a47304402201277890a61d53566107ef14d6f6e452593f41e21ef4144fa501a8177a1f2ddc20220508618d4562099f08d1b4eddc090773ad2d8d6951f968d71a69beb6bdf1a4957012103bc1058508545cdcf109d22c8761855273657468b861a457efa19356fa4416016fffffffffb7ef969f25ec90515ea6bfa5e2e4d6e3f3e8c325666d32a64f671ab5d2c810c170700006a473044022046ea63f776df5f51c9a2b0331e4f3c37e3db00ca2600545f243d07d61cf8ee18022020362088db2af244faf68deec22e8b0720dc86e5c59d11528badece826e54800012102be1af70746205b59578344e970d283fbedb956d444a4553d90efdffed100781dfffffffffb7ef969f25ec90515ea6bfa5e2e4d6e3f3e8c325666d32a64f671ab5d2c810c140700006a47304402207a73ab94be86fd6da31a71e1c1441ba6720db5f0412c725328cc0a3478c21c710220167f3f45c44ef6e235eb419f672aa71785d8dd0583e3b212e9951d890491b4560121024ec85e66fd78b2c879b69e4c1b0b9e4347e63979d0b42e3ac6556b70f925e6b6ffffffff0df4d856ed410700001976a91425fa97ea6b3691ab9204f6914f676c40bde778ff88ac00bca065010000001976a91485df1d6275a3e6cb84efae078def44738fcda6c588ac00beda987e8d03001976a9144eadb0ae193a5a53454bc2c20ea31810a3b4d4d288ac0087ce5b080000001976a91483d1979977b6c5f29cacf2c03f7eff86d6472b5588ac9907b959170100001976a91485a27ad6849897b1b0c9240849d1ead361613be988ac0fc3a2eacc0b00001976a914347b22316f4920eba6b61aa79889c314386f9a6088ac00c6665e740000001976a914984209d713165702616b286fc0e97993f95b5b1488aceea5bdb3b80200001976a91430b8245e3cf038941c6cb97d005cc6624c207db088ac0030ef7dba0200001976a914acb20b6e7afca9f6ed88cb523092d2fe633c9f0488ac002d59f2fc7000001976a914424d65ab9c4e7975883c859b1b73a051a2aa417488ac008e02de900000001976a914b120f53a07bc2b6953c7c83d01270049c7fc188a88ac00126d79430000001976a91461156647b0bc24e3b7267aeef9fec02ec2326f9288ac78e765c3735428001976a9142d5780eb2ae8e988393e9e7b7171ec0a8757aee088ac00000000',
            raw: {
                version: 1,
                locktime: 0,
                ins: [
                    {
                        hash: 'f207139eede9036fbffa7c38c2fa7b31b7f8b05e506469e2a864e6ba4f650309',
                        index: 3,
                        data: '4730440220518834f033ddbde0f8cd7364cf4f63986a5d351bd6902678e2b155bd64868dcd022065380ef6896fadb76af9cabbac0cb55f2450c3bf231ea5c33d53852feda7a230012102afac6ae55a124be8b3cf7c6c41b434ad39e19666133c9a7eccc245de2d87b2a8',
                        sequence: 4294967295,
                    },
                    {
                        hash: '738a37e5c5e8b47c6fb3626429d7c283454d5d0eb60345ab391d7454e7af2841',
                        index: 181,
                        data: '47304402202bf2000d4caf630c099ed36d4a946fee06145f8ee01a6b95db9bd6e6f28c21d402202a398ea73f0a927672a0504af35c6ccde9a9f9b72ad0043247f9779602cf4e8c01210306ca53dc026ca1743f4a5a975433f834b008631bf0440fbf08ed998803d0e76d',
                        sequence: 4294967295,
                    },
                    {
                        hash: '0eb391629d18e49d76efc8d381771dfb10f8349ff3c1abb374f6bb138d3bcee5',
                        index: 0,
                        data: '483045022100bf49f4ce04ecc1c1980369621915a738bb3715ee34f3750540d3998637072a1302206f463374e24037e142b2623aade22cb20cbbda6748bf2d67eb30e6dcc9e4d4b6012103246d027b055891843aaf55eb0dbe625d3a51bdb894a48e6959566bec74458fef',
                        sequence: 4294967295,
                    },
                    {
                        hash: '4c5d66d28e98394c0eb913b9d53302d1b82c0417c7a4936a46e4e4babb668a23',
                        index: 57,
                        data: '473044022038f33042c6bdf95ff0661b9350e8302bc2c9c2361f634e74205b729c5c384dbb02204709a5a07cfdfe195026a539445cbfccf19bc2c5a2b7d8ac1cf145547d814c2201210205615a3cf8b06580b5309121dfd5420ee638dd5efc3a3a4e228573cf95ea2a02',
                        sequence: 4294967295,
                    },
                    {
                        hash: '4c5d66d28e98394c0eb913b9d53302d1b82c0417c7a4936a46e4e4babb668a23',
                        index: 1017,
                        data: '483045022100a866d3cf574b6378797231fb5f2cc450d2ca546fb6c7f43fba16362c6269eb500220290840dba0b66686bd07b451e9dfc58ddf5c26fb459b37326ad9833236a083c701210220e4154c356afa89b3d67109b8b73cef0a5fd1ac59486e1f8e81d25fbc27c456',
                        sequence: 4294967295,
                    },
                    {
                        hash: 'c9b0c41a4a8c8b2d2541b71325490f0f3431a69284a4bfe8d7d3081d37b3d640',
                        index: 746,
                        data: '47304402206ecfa69c0fbb21344d9eeccdaafc8f09b1fbff5405a2d66a6303f03269e82f3e022028ebe103701ca8271b9c168fc7fd073b5b6a2669f166990b63a21580536871920121034e5a9689ac5f1862c3e886a792788efd30316d72a8a18907102d80211ef8b57a',
                        sequence: 4294967295,
                    },
                    {
                        hash: 'fb7ef969f25ec90515ea6bfa5e2e4d6e3f3e8c325666d32a64f671ab5d2c810c',
                        index: 1817,
                        data: '47304402201277890a61d53566107ef14d6f6e452593f41e21ef4144fa501a8177a1f2ddc20220508618d4562099f08d1b4eddc090773ad2d8d6951f968d71a69beb6bdf1a4957012103bc1058508545cdcf109d22c8761855273657468b861a457efa19356fa4416016',
                        sequence: 4294967295,
                    },
                    {
                        hash: 'fb7ef969f25ec90515ea6bfa5e2e4d6e3f3e8c325666d32a64f671ab5d2c810c',
                        index: 1815,
                        data: '473044022046ea63f776df5f51c9a2b0331e4f3c37e3db00ca2600545f243d07d61cf8ee18022020362088db2af244faf68deec22e8b0720dc86e5c59d11528badece826e54800012102be1af70746205b59578344e970d283fbedb956d444a4553d90efdffed100781d',
                        sequence: 4294967295,
                    },
                    {
                        hash: 'fb7ef969f25ec90515ea6bfa5e2e4d6e3f3e8c325666d32a64f671ab5d2c810c',
                        index: 1812,
                        data: '47304402207a73ab94be86fd6da31a71e1c1441ba6720db5f0412c725328cc0a3478c21c710220167f3f45c44ef6e235eb419f672aa71785d8dd0583e3b212e9951d890491b4560121024ec85e66fd78b2c879b69e4c1b0b9e4347e63979d0b42e3ac6556b70f925e6b6',
                        sequence: 4294967295,
                    },
                ],
                outs: [
                    {
                        value: '7979736160500',
                        data: '76a91425fa97ea6b3691ab9204f6914f676c40bde778ff88ac',
                    },
                    {
                        value: '6000000000',
                        data: '76a91485df1d6275a3e6cb84efae078def44738fcda6c588ac',
                    },
                    {
                        value: '999999800000000',
                        data: '76a9144eadb0ae193a5a53454bc2c20ea31810a3b4d4d288ac',
                    },
                    {
                        value: '35900000000',
                        data: '76a91483d1979977b6c5f29cacf2c03f7eff86d6472b5588ac',
                    },
                    {
                        value: '1199801173913',
                        data: '76a91485a27ad6849897b1b0c9240849d1ead361613be988ac',
                    },
                    {
                        value: '12974737769231',
                        data: '76a914347b22316f4920eba6b61aa79889c314386f9a6088ac',
                    },
                    {
                        value: '499800000000',
                        data: '76a914984209d713165702616b286fc0e97993f95b5b1488ac',
                    },
                    {
                        value: '2992312788462',
                        data: '76a91430b8245e3cf038941c6cb97d005cc6624c207db088ac',
                    },
                    {
                        value: '3000000000000',
                        data: '76a914acb20b6e7afca9f6ed88cb523092d2fe633c9f0488ac',
                    },
                    {
                        value: '124231700000000',
                        data: '76a914424d65ab9c4e7975883c859b1b73a051a2aa417488ac',
                    },
                    {
                        value: '622200000000',
                        data: '76a914b120f53a07bc2b6953c7c83d01270049c7fc188a88ac',
                    },
                    {
                        value: '289800000000',
                        data: '76a91461156647b0bc24e3b7267aeef9fec02ec2326f9288ac',
                    },
                    {
                        value: '11351855244633976',
                        data: '76a9142d5780eb2ae8e988393e9e7b7171ec0a8757aee088ac',
                    },
                ],
            },
            coinbase: false,
            virtualSize: 1777,
            weight: 7108,
        },
        {
            description: 'Doge transaction with big outputs',
            id: 'ffd9ef4053c37128c00a8f442336ba9fcec755aace8a39fc742b5830a9b392c2',
            hash: 'c292b3a930582b74fc398aceaa55c7ce9fba3623448f0ac02871c35340efd9ff',
            hex: '010000000183aaa0c946a12fb28e69e3f3a6a2113fbcbbfea5c879a078eb2bfa7ac04b25ad010000006b483045022100bf1d4c0579949feaba98b613eed605246e8c11803a0d7cab13e6bcd03b86ef50022004e0d099fabf1074bee438ba24d8851813a92ac3534ae9ee08b97dc59802b1e8012102d54f3214a13accb464ab2412f7e745eff2a6f5547ecadeb8f78c8f0c78626a00fcffffff02382817fae70000001976a91451105663eb56ea5d43bf9e12c1fb39652631460888ac995696b8e5b0ca001976a914ae3ce753180aae16265478e796d76a7d322397c988ac00000000',
            raw: {
                version: 1,
                locktime: 0,
                ins: [
                    {
                        hash: '83aaa0c946a12fb28e69e3f3a6a2113fbcbbfea5c879a078eb2bfa7ac04b25ad',
                        index: 1,
                        data: '483045022100bf1d4c0579949feaba98b613eed605246e8c11803a0d7cab13e6bcd03b86ef50022004e0d099fabf1074bee438ba24d8851813a92ac3534ae9ee08b97dc59802b1e8012102d54f3214a13accb464ab2412f7e745eff2a6f5547ecadeb8f78c8f0c78626a00',
                        sequence: 4294967292,
                    },
                ],
                outs: [
                    {
                        value: '996333267000',
                        data: '76a91451105663eb56ea5d43bf9e12c1fb39652631460888ac',
                    },
                    {
                        value: '57052445986412185',
                        data: '76a914ae3ce753180aae16265478e796d76a7d322397c988ac',
                    },
                ],
            },
            coinbase: false,
            virtualSize: 226,
            weight: 904,
        },
    ],
};
