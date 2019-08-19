const releases = [
    {
        required: false,
        version: [2, 1, 1],
        min_bridge_version: [2, 0, 7],
        min_firmware_version: [2, 0, 5],
        min_bootloader_version: [2, 0, 0],
        url: 'data/firmware/2/trezor-2.1.1.bin',
        fingerprint: '1b3166a878658fcd2ff82c7ac9a2587da544fd105f678cc7b4d41cba5a8d4c01',
        changelog:
            "* Hotfix for touchscreen freeze\n* Don't rotate the screen via swipe gesture\n* Set screen rotation via user setting\n* More strict path validations\n* Display non-zero locktime values\n* EOS support\n* Monero UI fixes\n* Speed and memory optimizations",
    },
    {
        required: false,
        version: [2, 1, 0],
        min_bridge_version: [2, 0, 7],
        min_firmware_version: [2, 0, 5],
        min_bootloader_version: [2, 0, 0],
        url: 'data/firmware/2/trezor-2.1.0.bin',
        tags: ['security'],
        fingerprint: 'bb5b0308807b45d41d1e2ab66a468152997ad69a01099789d8a35e464cde999f',
        changelog:
            '* Security improvements\n* Upgraded to new storage format\n* Ripple, Stellar, Cardano and NEM fixes\n* New coins: ATS, AXE, FLO, GIN, KMD, NIX,\n  PIVX, REOSC, XPM, XSN, ZCL\n* New ETH tokens',
    },
    {
        required: false,
        version: [2, 0, 10],
        min_bridge_version: [2, 0, 7],
        min_firmware_version: [2, 0, 5],
        min_bootloader_version: [2, 0, 0],
        url: 'data/firmware/2/trezor-2.0.10.bin',
        fingerprint: 'fcaa6ee206c2c121eb2d45d065d66f0879f14be45c244d4acf908be1de22275e',
        changelog:
            '* Fix Monero payment ID computation\n* Fix issue with touch screen and flickering\n* Add support for OMNI layer: OMNI/MAID/USDT\n* Add support for new coins: BTX, CPC, GAME, RVN\n* Add support for new Ethereum tokens',
    },
    {
        required: false,
        version: [2, 0, 9],
        bootloader_version: [2, 0, 0],
        min_bridge_version: [2, 0, 7],
        min_firmware_version: [2, 0, 5],
        min_bootloader_version: [2, 0, 0],
        url: 'data/firmware/2/trezor-2.0.9.bin',
        fingerprint: '87be93d6966e7a9eff78dc7b434d1a138ec8d1ee0300882d16f90b606f3a806b',
        changelog: '* Small Monero and Segwit bugfixes',
    },
    {
        required: false,
        version: [2, 0, 8],
        bootloader_version: [2, 0, 0],
        min_bridge_version: [2, 0, 7],
        min_firmware_version: [2, 0, 5],
        min_bootloader_version: [2, 0, 0],
        url: 'data/firmware/2/trezor-2.0.8.bin',
        fingerprint: '642b6215bda981f8eacafee34dbee5cdeee7d47d49f605bbe2828a8d9b79813d',
        changelog:
            '* Monero support\n* Cardano support\n* Stellar support\n* Ripple support\n* Tezos support\n* Decred support\n* Groestlcoin support\n* Zencash support\n* Zcash sapling hardfork support\n* Implemented seedless setup',
    },
    {
        required: false,
        version: [2, 0, 7],
        bootloader_version: [2, 0, 0],
        min_bridge_version: [2, 0, 7],
        min_firmware_version: [2, 0, 5],
        min_bootloader_version: [2, 0, 0],
        url: 'data/firmware/2/trezor-2.0.7.bin',
        fingerprint: 'f3a42e640e526fba6574fafa520fc7d97ef9f557d24da24d9a2ea4176a4c4164',
        changelog:
            '* Bitcoin Cash cashaddr support\n* Zcash Overwinter hardfork support\n* NEM support\n* Lisk support\n* Show warning on home screen if PIN is not set\n* Support for new coins:\n  - Bitcoin Private, Fujicoin, Vertcoin, Viacoin, Zcoin\n* Support for new Ethereum networks:\n  - EOS Classic, Ethereum Social, Ellaism, Callisto, EtherGem, Wanchain\n* Support for 500+ new Ethereum tokens',
        notes:
            'https://blog.trezor.io/june-updates-trezor-devices-one-modelt-wallet-zcash-cashaddr-doge-8d98c2a73036',
    },
    {
        required: false,
        version: [2, 0, 6],
        bootloader_version: [2, 0, 0],
        min_bridge_version: [2, 0, 7],
        min_firmware_version: [2, 0, 5],
        min_bootloader_version: [2, 0, 0],
        url: 'data/firmware/2/trezor-2.0.6.bin',
        fingerprint: '4eccabf2fd7e121ed0da657c064a65c5694402497e60ea2ac2dcf1e118db9cc6',
        changelog:
            '* Fix layout for Ethereum transactions\n* Fix public key generation for SSH and GPG\n* Add special characters to passphrase keyboard',
    },
    {
        required: true,
        version: [2, 0, 5],
        bootloader_version: [2, 0, 0],
        min_bridge_version: [2, 0, 7],
        min_firmware_version: [2, 0, 5],
        min_bootloader_version: [2, 0, 0],
        url: 'data/firmware/2/trezor-2.0.5.bin',
        fingerprint: '851172eab96c07bf9efb43771cb0fd14dc0320a68de047132c7bd787a1ad64e9',
        changelog: '* First public release',
    },
];

export default releases;
