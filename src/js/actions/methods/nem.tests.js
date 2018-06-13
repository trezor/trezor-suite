const nem = {
    TYPE_TRANSACTION_TRANSFER: 0x0101,
    TYPE_IMPORTANCE_TRANSFER: 0x0801,
    TYPE_AGGREGATE_MODIFICATION: 0x1001,
    TYPE_PROVISION_NAMESPACE: 0x2001,
    TYPE_MOSAIC_CREATION: 0x4001,
    TYPE_MOSAIC_SUPPLY_CHANGE: 0x4002,

    TYPE_MULTISIG_SIGNATURE: 0x1002,
    TYPE_MULTISIG: 0x1004
}

export default {

    // From: https://github.com/trezor/python-trezor/blob/master/trezorlib/tests/device_tests/test_msg_nem_signtx_mosaics.py

    'SupplyChange': {
        "timeStamp": 74649215,
        "fee": 2000000,
        "type": nem.TYPE_MOSAIC_SUPPLY_CHANGE,
        "deadline": 74735615,
        "message": {
        },
        "mosaicId": {
            "namespaceId": "hellom",
            "name": "Hello mosaic"
        },
        "supplyType": 1,
        "delta": 1,
        "version": (0x98 << 24),
        "creationFeeSink": "TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J",
        "creationFee": 1500,
    },

    'MosaicCreation': {
        "timeStamp": 74649215,
        "fee": 2000000,
        "type": nem.TYPE_MOSAIC_CREATION,
        "deadline": 74735615,
        "message": {
        },
        "mosaicDefinition": {
            "id": {
                "namespaceId": "hellom",
                "name": "Hello mosaic"
            },
            "levy": {},
            "properties": {},
            "description": "lorem"
        },
        "version": (0x98 << 24),
        "creationFeeSink": "TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J",
        "creationFee": 1500,
    },


    'MosaicCreationProperties': {
        "timeStamp": 74649215,
        "fee": 2000000,
        "type": nem.TYPE_MOSAIC_CREATION,
        "deadline": 74735615,
        "message": {
        },
        "mosaicDefinition": {
            "id": {
                "namespaceId": "hellom",
                "name": "Hello mosaic"
            },
            "levy": {},
            "properties": [
                {
                    "name": "divisibility",
                    "value": "4"
                },
                {
                    "name": "initialSupply",
                    "value": "200"
                },
                {
                    "name": "supplyMutable",
                    "value": "false"
                },
                {
                    "name": "transferable",
                    "value": "true"
                }
            ],
            "description": "lorem"
        },
        "version": (0x98 << 24),
        "creationFeeSink": "TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J",
        "creationFee": 1500,
    },

    'MosaicCreationLevy': {
        "timeStamp": 74649215,
        "fee": 2000000,
        "type": nem.TYPE_MOSAIC_CREATION,
        "deadline": 74735615,
        "message": {
        },
        "mosaicDefinition": {
            "id": {
                "namespaceId": "hellom",
                "name": "Hello mosaic"
            },
            "properties": [
                {
                    "name": "divisibility",
                    "value": "4"
                },
                {
                    "name": "initialSupply",
                    "value": "200"
                },
                {
                    "name": "supplyMutable",
                    "value": "false"
                },
                {
                    "name": "transferable",
                    "value": "true"
                }
            ],
            "levy": {
                "type": 1,
                "fee": 2,
                "recipient": "TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J",
                "mosaicId": {
                    "namespaceId": "hellom",
                    "name": "Hello mosaic"
                },
            },
            "description": "lorem"
        },
        "version": (0x98 << 24),
        "creationFeeSink": "TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J",
        "creationFee": 1500,
    },

    // From: https://github.com/trezor/python-trezor/blob/master/trezorlib/tests/device_tests/test_msg_nem_signtx_multisig.py

    'AggregateModifications': {
        "timeStamp": 74649215,
        "fee": 2000000,
        "type": nem.TYPE_AGGREGATE_MODIFICATION,
        "deadline": 74735615,
        "message": {
        },
        "modifications": [
            {
                "modificationType": 1,
                "cosignatoryAccount": "c5f54ba980fcbb657dbaaa42700539b207873e134d2375efeab5f1ab52f87844"
            },
        ],
        "minCosignatories": {
            "relativeChange": 3
        },
        "version": (0x98 << 24),
    },

    'Multisig1': {
        "timeStamp": 1,
        "fee": 10000,
        "type": nem.TYPE_MULTISIG,
        "deadline": 74735615,
        "otherTrans": {
            "timeStamp": 2,
            "amount": 2000000,
            "fee": 15000,
            "recipient": "TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J",
            "type": nem.TYPE_TRANSACTION_TRANSFER,
            "deadline": 67890,
            "message": {
                "payload": new Buffer("test_nem_transaction_transfer").toString('hex'),
                "type": 1,
            },
            "version": (0x98 << 24),
            "signer": 'c5f54ba980fcbb657dbaaa42700539b207873e134d2375efeab5f1ab52f87844',
        },
        "version": (0x98 << 24),
    },


    'Multisig2': {
        "timeStamp": 74649215,
        "fee": 150,
        "type": nem.TYPE_MULTISIG,
        "deadline": 789,
        "otherTrans": {
            "timeStamp": 123456,
            "fee": 2000,
            "type": nem.TYPE_PROVISION_NAMESPACE,
            "deadline": 100,
            "message": {
            },
            "newPart": "ABCDE",
            "rentalFeeSink": "TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J",
            "rentalFee": 1500,
            "parent": null,
            "version": (0x98 << 24),
            "signer": 'c5f54ba980fcbb657dbaaa42700539b207873e134d2375efeab5f1ab52f87844',
        },
        "version": (0x98 << 24),
    },

    'MultisigSigner1': {
        "timeStamp": 333,
        "fee": 200,
        "type": nem.TYPE_MULTISIG_SIGNATURE,
        "deadline": 444,
        "otherTrans": {
            "timeStamp": 555,
            "amount": 2000000,
            "fee": 2000000,
            "recipient": "TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J",
            "type": nem.TYPE_TRANSACTION_TRANSFER,
            "deadline": 666,
            "message": {
                "payload": new Buffer("test_nem_transaction_transfer").toString('hex'),
                "type": 1,
            },
            "version": (0x98 << 24),
            "signer": 'c5f54ba980fcbb657dbaaa42700539b207873e134d2375efeab5f1ab52f87844',
        },
        "version": (0x98 << 24),
    },

    'MultisigSigner2': {
        "timeStamp": 900000,
        "fee": 200000,
        "type": nem.TYPE_MULTISIG_SIGNATURE,
        "deadline": 100,
        "otherTrans": {
            "timeStamp": 101111,
            "fee": 1000,
            "type": nem.TYPE_MOSAIC_SUPPLY_CHANGE,
            "deadline": 13123,
            "message": {
            },
            "mosaicId": {
                "namespaceId": "hellom",
                "name": "Hello mosaic"
            },
            "supplyType": 1,
            "delta": 1,
            "version": (0x98 << 24),
            "creationFeeSink": "TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J",
            "creationFee": 1500,
            "signer": 'c5f54ba980fcbb657dbaaa42700539b207873e134d2375efeab5f1ab52f87844',
        },
        "version": (0x98 << 24),
    },

    // From: https://github.com/trezor/python-trezor/blob/master/trezorlib/tests/device_tests/test_msg_nem_signtx_others.py

    'ImportanceTransfer': {
        "timeStamp": 12349215,
        "fee": 9900,
        "type": nem.TYPE_IMPORTANCE_TRANSFER,
        "deadline": 99,
        "message": {
        },
        "importanceTransfer": {
            "mode": 1,
            "publicKey": "c5f54ba980fcbb657dbaaa42700539b207873e134d2375efeab5f1ab52f87844",
        },
        "version": (0x98 << 24),
    },

    'ProvisionNamespace': {
        "timeStamp": 74649215,
        "fee": 2000000,
        "type": nem.TYPE_PROVISION_NAMESPACE,
        "deadline": 74735615,
        "message": {
        },
        "newPart": "ABCDE",
        "rentalFeeSink": "TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J",
        "rentalFee": 1500,
        "parent": null,
        "version": (0x98 << 24),
    },

    // From: https://github.com/trezor/python-trezor/blob/master/trezorlib/tests/device_tests/test_msg_nem_signtx_transfers.py

    'Simple': {
        "timeStamp": 74649215,
        "amount": 2000000,
        "fee": 2000000,
        "recipient": "TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J",
        "type": nem.TYPE_TRANSACTION_TRANSFER,
        "deadline": 74735615,
        "message": {
            "payload": new Buffer("test_nem_transaction_transfer").toString('hex'),
            "type": 1,
        },
        "version": (0x98 << 24),
    },

    'EncryptedPayload': {
        "timeStamp": 74649215,
        "amount": 2000000,
        "fee": 2000000,
        "recipient": "TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J",
        "type": nem.TYPE_TRANSACTION_TRANSFER,
        "deadline": 74735615,
        "message": {
            "payload": new Buffer("this message should be encrypted").toString('hex'),
            "publicKey": "5a5e14c633d7d269302849d739d80344ff14db51d7bcda86045723f05c4e4541",
            "type": 2,
        },
        "version": (0x98 << 24),
    },

    'XemAsMosaic': {
        "timeStamp": 76809215,
        "amount": 5000000,
        "fee": 1000000,
        "recipient": "TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J",
        "type": nem.TYPE_TRANSACTION_TRANSFER,
        "deadline": 76895615,
        "version": (0x98 << 24),
        "message": {
        },
        "mosaics": [
            {
                "mosaicId": {
                    "namespaceId": "nem",
                    "name": "xem",
                },
                "quantity": 9000000,
            },
        ],
    },

    'UnknownMosaic': {
        "timeStamp": 76809215,
        "amount": 2000000,
        "fee": 1000000,
        "recipient": "TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J",
        "type": nem.TYPE_TRANSACTION_TRANSFER,
        "deadline": 76895615,
        "version": (0x98 << 24),
        "message": {
        },
        "mosaics": [
            {
                "mosaicId": {
                    "namespaceId": "xxx",
                    "name": "aa",
                },
                "quantity": 3500000,
            },
        ],
    },

    'KnownMosaic': {
        "timeStamp": 76809215,
        "amount": 3000000,
        "fee": 1000000,
        "recipient": "NDMYSLXI4L3FYUQWO4MJOVL6BSTJJXKDSZRMT4LT",
        "type": nem.TYPE_TRANSACTION_TRANSFER,
        "deadline": 76895615,
        "version": (0x68 << 24),
        "message": {
        },
        "mosaics": [
            {
                "mosaicId": {
                    "namespaceId": "dim",
                    "name": "token",
                },
                "quantity": 111000,
            },
        ],
    },

    'KnownMosaicWithLevy': {
        "timeStamp": 76809215,
        "amount": 2000000,
        "fee": 1000000,
        "recipient": "NDMYSLXI4L3FYUQWO4MJOVL6BSTJJXKDSZRMT4LT",
        "type": nem.TYPE_TRANSACTION_TRANSFER,
        "deadline": 76895615,
        "version": (0x68 << 24),
        "message": {
        },
        "mosaics": [
            {
                "mosaicId": {
                    "namespaceId": "dim",
                    "name": "coin",
                },
                "quantity": 222000,
            },
        ],
    },

    'MultipleMosaics': {
        "timeStamp": 76809215,
        "amount": 2000000,
        "fee": 1000000,
        "recipient": "NDMYSLXI4L3FYUQWO4MJOVL6BSTJJXKDSZRMT4LT",
        "type": nem.TYPE_TRANSACTION_TRANSFER,
        "deadline": 76895615,
        "version": (0x68 << 24),
        "message": {
        },
        "mosaics": [
            {
                "mosaicId": {
                    "namespaceId": "nem",
                    "name": "xem",
                },
                "quantity": 3000000,
            },
            {
                "mosaicId": {
                    "namespaceId": "abc",
                    "name": "mosaic",
                },
                "quantity": 200,
            },
            {
                "mosaicId": {
                    "namespaceId": "nem",
                    "name": "xem",
                },
                "quantity": 30000,
            },
            {
                "mosaicId": {
                    "namespaceId": "abc",
                    "name": "mosaic",
                },
                "quantity": 2000000,
            },
            {
                "mosaicId": {
                    "namespaceId": "breeze",
                    "name": "breeze-token",
                },
                "quantity": 111000,
            }
        ]
    },
}