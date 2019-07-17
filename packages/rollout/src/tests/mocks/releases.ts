const releases = [
    {
        required: false,
        version: [1, 8, 1],
        bootloader_version: [1, 8, 0],
        min_bridge_version: [2, 0, 25],
        min_firmware_version: [1, 6, 2],
        min_bootloader_version: [1, 5, 0],
        url: 'data/firmware/1/trezor-1.8.1.bin',
        fingerprint: '019e849c1eb285a03a92bbad6d18a328af3b4dc6999722ebb47677b403a4cd16',
        changelog: '* Fix fault when using the device with no PIN* Fix OMNI transactions parsing',
    },
    {
        required: false,
        version: [1, 8, 0],
        bootloader_version: [1, 8, 0],
        min_bridge_version: [2, 0, 25],
        min_firmware_version: [1, 6, 2],
        min_bootloader_version: [1, 5, 0],
        url: 'data/firmware/1/trezor-1.8.0.bin',
        tags: ['security'],
        fingerprint: 'd65f0c07a6a9c53d8b5287798eb53154b33f9e87cd38a3701970e3d0a750a659',
        changelog:
            '* Security improvements\n* Upgraded to new storage format\n* Stellar and NEM fixes\n* New coins: ATS, KMD, XPM, XSN, ZCL\n* New ETH tokens',
    },
    {
        required: false,
        version: [1, 7, 3],
        bootloader_version: [1, 6, 1],
        min_bridge_version: [2, 0, 25],
        min_firmware_version: [1, 6, 2],
        min_bootloader_version: [1, 5, 0],
        url: 'data/firmware/1/trezor-1.7.3.bin',
        fingerprint: '10acc6aa4f24aff36627473b98c23dc4f6d0220d33bc1e09cb572f02410ffdaf',
        changelog: '* Fix USB issue on some Windows 10 installations',
    },
    {
        required: false,
        version: [1, 7, 2],
        bootloader_version: [1, 6, 0],
        min_bridge_version: [2, 0, 25],
        min_firmware_version: [1, 6, 2],
        min_bootloader_version: [1, 5, 0],
        url: 'data/firmware/1/trezor-1.7.2.bin',
        fingerprint: '4d5c7ac191dba315b2433af27c187925fb713d06984cc6f566231d809dd8d370',
        changelog:
            "* Add support for OMNI layer: OMNI/MAID/USDT\n* U2F fixes\n* Don't ask for PIN if it has been just set",
        notes: 'https://blog.trezor.io/trezor-one-1-7-2-support-for-omni-layer-cbf699e4ffae',
    },
    {
        required: false,
        version: [1, 7, 1],
        bootloader_version: [1, 6, 0],
        min_bridge_version: [2, 0, 25],
        min_firmware_version: [1, 6, 2],
        min_bootloader_version: [1, 5, 0],
        url: 'data/firmware/1/trezor-1.7.1.bin',
        fingerprint: '1c303c50bb45d3f35da9e962d8405d0b8e89cc45e122496a48fce3995fa71d48',
        changelog:
            '* Switch from HID to WebUSB\n* Add support for Stellar\n* Add support for Lisk\n* Add support for Zcash Sapling hardfork\n* Implement seedless setup',
        notes:
            'https://blog.trezor.io/firmware-updates-moving-from-the-beta-wallet-to-stable-c487931c3596',
    },
    {
        required: false,
        version: [1, 6, 3],
        bootloader_version: [1, 5, 1],
        min_bridge_version: [1, 1, 5],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.6.3.bin',
        fingerprint: 'e8dbb4b7fe8384afd4c99790277c2f2f366a1a0f3957aa3545c75371a99a8fcc',
        changelog:
            '* Implement RSKIP-60 Ethereum checksum encoding\n* Add support for new Ethereum networks (ESN, AKA, ETHO, MUSI, PIRL, ATH, GO)\n* Add support for new 80 Ethereum tokens\n* Improve MPU configuration',
        notes: 'https://blog.trezor.io/trezor-one-firmware-update-1-6-3-73894c0506d',
    },
    {
        required: false,
        version: [1, 6, 2],
        bootloader_version: [1, 5, 0],
        min_bridge_version: [1, 1, 5],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.6.2.bin',
        fingerprint: 'd31304f793854e343df6ccf1804f7e2abf48ddcd82a379ca2d3711d54127e138',
        changelog:
            '* Add possibility to set custom auto-lock delay\n* Bitcoin Cash cashaddr support\n* Zcash Overwinter hardfork support\n* Support for new coins:\n  - Decred, Bitcoin Private, Fujicoin, Groestlcoin, Vertcoin, Viacoin, Zcoin\n* Support for new Ethereum networks:\n  - EOS Classic, Ethereum Social, Ellaism, Callisto, EtherGem, Wanchain\n* Support for 500+ new Ethereum tokens',
        notes:
            'https://blog.trezor.io/june-updates-trezor-devices-one-modelt-wallet-zcash-cashaddr-doge-8d98c2a73036',
    },
    {
        required: true,
        version: [1, 6, 1],
        bootloader_version: [1, 4, 0],
        min_bridge_version: [1, 1, 5],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.6.1.bin',
        fingerprint: '83c3190a94e524ac83a1704eb584a2ab53f8a65a893b1ab52e7135812857c807',
        changelog:
            '* Use fixed-width font for addresses\n* Lots of under-the-hood improvements\n* Fixed issue with write-protection settings',
        notes: 'https://blog.trezor.io/trezor-one-firmware-update-1-6-1-eecd0534ab95',
    },
    {
        required: false,
        version: [1, 6, 0],
        min_bridge_version: [1, 1, 5],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.6.0.bin',
        fingerprint: 'e40f6ce12724c2d24234a7752953b88fd9ec28b3ec72c0dbfa280095a67a06ca',
        changelog:
            '* Native SegWit (Bech32) address support\n* Show recognized BIP44/BIP49 paths in GetAddress dialog\n* NEM support\n* Expanse and UBIQ chains support\n* Bitcoin Gold, DigiByte, Monacoin support\n* Ed25519 collective signatures (CoSi) support',
        notes:
            'https://blog.trezor.io/expanded-cryptos-cryptocurrency-support-firmware-1-6-0-3825b5853470',
    },
    {
        required: true,
        version: [1, 5, 2],
        min_bridge_version: [1, 1, 5],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.5.2.bin',
        fingerprint: '99f71379dec893fbe109832a1150f338660be686fe6b4903ff10ff751ba4e448',
        changelog: '* clean memory on start\n* fix storage import from older versions',
        notes: 'https://blog.trezor.io/trezor-firmware-security-update-1-5-2-5ef1b6f13fed',
    },
    {
        required: false,
        version: [1, 5, 1],
        min_bridge_version: [1, 1, 5],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.5.1.bin',
        fingerprint: '1c1fa9802cbd6a947a4f3e78f209d3efe49eb4abbacb101bbc3a0a709c742707',
        changelog:
            '* Wipe storage after 16 wrong PIN attempts\n* Enable Segwit for Bitcoin\n* Bcash aka Bitcoin Cash support\n* Message signing/verification for Ethereum and Segwit\n* Make address dialog nicer (switch text/QR via button)\n* Use checksum for Ethereum addresses\n* Add more ERC-20 tokens, handle unrecognized ERC-20 tokens\n* Allow "dry run" recovery procedure\n* Allow separated backup procedure',
    },
    {
        required: false,
        version: [1, 5, 0],
        min_bridge_version: [1, 1, 5],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.5.0.bin',
        fingerprint: 'c4eddafd29b580d8482cda68e61bdcf1740d77520ef3a603758646bbffe957ea',
        changelog:
            '* Enable Segwit for Testnet and Litecoin\n* Enable ERC-20 tokens for Ethereum chains',
    },
    {
        required: false,
        version: [1, 4, 2],
        min_bridge_version: [1, 1, 5],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.4.2.bin',
        fingerprint: 'a4b39f01bd134d01d7534821445bf779dbe6c25f0fcf7c7cb285a79b17f25e0a',
        changelog:
            '* New Matrix-based recovery method\n* Minor Ethereum fixes (including EIP-155 replay protection)\n* Minor USB, U2F and GPG fixes',
    },
    {
        required: false,
        version: [1, 4, 1],
        min_bridge_version: [1, 1, 5],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.4.1.bin',
        fingerprint: '92636493f76f352213e681bbc26eb3a8844f7b8a3044214b65c3c2c10a0f788c',
        changelog:
            '* Support for Zcash JoinSplit transactions\n* Enable device lock after 10 minutes of inactivity\n* Enable device lock by pressing left button for 2 seconds\n* Confirm dialog for U2F counter change',
    },
    {
        required: false,
        version: [1, 4, 0],
        min_bridge_version: [1, 1, 5],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.4.0.bin',
        fingerprint: '5764715dbcf8ed88bc0ae1c2f715277f22b67f26c15e1f7543b2b44913b5c255',
        changelog: '* U2F support\n* Ethereum support\n* GPG decryption support\n* Zcash support',
        notes:
            'https://blog.trezor.io/secure-two-factor-authentication-with-trezor-u2f-e940fd5a60af',
    },
    {
        required: false,
        version: [1, 3, 6],
        min_bridge_version: [1, 1, 5],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.3.6.bin',
        fingerprint: '03b559a758961b2bfd4443e6c36c10025268cf033ecd376fdd7a79ff658bf511',
        changelog:
            '* Enable advanced transactions such as ones with REPLACE-BY-FEE and CHECKLOCKTIMEVERIFY\n* Fix message signing for altcoins\n* Message verification now shows address\n* Enable GPG signing support\n* Enable Ed25519 curve (for SSH and GPG)\n* Use separate deterministic hierarchy for NIST256P1 and Ed25519 curves\n* Users using SSH already need to regenerate their keys using the new firmware!!!',
        notes: 'https://blog.trezor.io/trezor-firmware-1-3-6-20a7df6e692',
    },
    {
        required: false,
        version: [1, 3, 5],
        min_bridge_version: [1, 1, 2],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.3.5.bin',
        fingerprint: '7d5d2c7defb93081a7fb7a2d1e57677fbac2a3e3e50f22fa3ff83ec4ddaafd9d',
        changelog:
            '* Double size font for recovery words during the device setup\n* Optimizations for simultaneous access when more applications try communicate with the device',
        notes:
            'https://blog.trezor.io/trezor-firmware-1-3-5-allows-for-multisession-operation-cc4c25197855',
    },
    {
        required: false,
        version: [1, 3, 4],
        min_bridge_version: [1, 1, 2],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.3.4.bin',
        fingerprint: '49e044eec84a9c210a09319d27a3ab8ba889ddeaa4d68f99d163f65267fce134',
        changelog:
            '* Screensaver active on ClearSession message\n* Support for NIST P-256 curve\n* Updated SignIdentity to v2 format\n* Show seconds counter during PIN lockdown\n* Updated maxfee per kb for coins',
        notes: 'https://blog.trezor.io/trezor-firmware-1-3-4-enables-ssh-login-86a622d7e609',
    },
    {
        required: true,
        version: [1, 3, 3],
        min_bridge_version: [1, 1, 0],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.3.3.bin',
        fingerprint: '7fcee4c0459c22109f3fcfe0040148e9be6d30947f7fffb76c66cc500681257c',
        changelog: '* Ask for PIN on GetAddress and GetPublicKey\n* Signing speed improved',
        notes: 'http://satoshilabs.com/old/news/2015-04-07-trezor-firmware-1-3-3-connect-api/',
    },
    {
        required: false,
        version: [1, 3, 2],
        min_bridge_version: [1, 1, 0],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.3.2.bin',
        fingerprint: '180656fbf94e43e0092eaf22c30ab3451a547b4213119bd62763dc97b94ad0d0',
        changelog:
            '* Fix check during transaction streaming\n* Login feature via SignIdentity message\n* GetAddress for multisig shows M of N description\n* PIN checking in constant time',
        notes: '',
    },
    {
        required: false,
        version: [1, 3, 1],
        min_bridge_version: [1, 1, 0],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.3.1.bin',
        fingerprint: '8030e257fc4c75a8f4a0325f8ea37428dd8fc68a5f9ec5f8e2d1a0de328860cc',
        changelog:
            '* Optimized signing speed\n* Enabled OP_RETURN\n* Added option to change home screen\n* Moved fee calculation before any signing\n* Made PIN delay increase immune against hardware hacking',
        notes:
            'http://satoshilabs.com/old/news/2015-02-18-trezor-firmware-1-3-1-smart-property-notary-service-customized-home-screen/',
    },
    {
        required: false,
        version: [1, 3, 0],
        min_bridge_version: [1, 1, 0],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.3.0.bin',
        fingerprint: '1d417e1e99a4880f7e03b991cf318eebe7b6cb453d2f55b8112adc5fd1a8293c',
        changelog:
            '* Added multisig support\n* Added visual validation of receiving address\n* Added ECIES encryption capabilities',
        notes: 'http://satoshilabs.com/old/news/2015-01-13-trezor-firmware-1-3-0-update-multisig/',
    },
    {
        required: true,
        version: [1, 2, 1],
        min_bridge_version: [1, 1, 0],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.2.1.bin',
        fingerprint: '0f8685ee46632162b549eb22b99a1e4e013d6796ae536ea6acb877a491f564f6',
        changelog: '* Added stack overflow protection\n* Added compatibility with TREZOR Bridge',
        notes: 'http://satoshilabs.com/old/news/2014-08-01-trezor-firmware-1-2-1-released/',
    },
    {
        required: false,
        version: [1, 2, 0],
        min_bridge_version: [1, 1, 0],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.2.0.bin',
        fingerprint: '0eec6fd320730acfa40963f0f470a47109378663907cc78b9c5797c19938c873',
        changelog:
            '* Fix false positives for fee warning\n* Better UI for signing/verifying messages\n* Smaller firmware size',
    },
    {
        required: false,
        version: [1, 1, 0],
        min_bridge_version: [1, 1, 0],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.1.0.bin',
        fingerprint: 'a1709ead62659851933830f494cf9aa40047d1f098955aa93bd483b92df88c8e',
        changelog:
            '* Minor UI fixes\n* Better handling of unexpected messages\n* Added AES support',
    },
    {
        required: true,
        version: [1, 0, 0],
        min_bridge_version: [1, 1, 0],
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        url: 'data/firmware/1/trezor-1.0.0.bin',
        fingerprint: '79371ee2ed2db8489aa4a5bce6907c24afc6de47e9658fef4cc12e2d902d9c51',
        changelog:
            '* Added support for streaming of transactions into the device\n* Removed all current limits on size of signed transaction',
    },
];

export default releases;
