export default {
    "package": null,
    "messages": [
        {
            "name": "Initialize",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "state",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "skip_passphrase",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "GetFeatures",
            "fields": [],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "Features",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "vendor",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "major_version",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "minor_version",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "patch_version",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "bootloader_mode",
                    "id": 5
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "device_id",
                    "id": 6
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "pin_protection",
                    "id": 7
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "passphrase_protection",
                    "id": 8
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "language",
                    "id": 9
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "label",
                    "id": 10
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "initialized",
                    "id": 12
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "revision",
                    "id": 13
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "bootloader_hash",
                    "id": 14
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "imported",
                    "id": 15
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "pin_cached",
                    "id": 16
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "passphrase_cached",
                    "id": 17
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "firmware_present",
                    "id": 18
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "needs_backup",
                    "id": 19
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "flags",
                    "id": 20
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "model",
                    "id": 21
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "fw_major",
                    "id": 22
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "fw_minor",
                    "id": 23
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "fw_patch",
                    "id": 24
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "fw_vendor",
                    "id": 25
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "fw_vendor_keys",
                    "id": 26
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "unfinished_backup",
                    "id": 27
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "ClearSession",
            "fields": [],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "ApplySettings",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "language",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "label",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "use_passphrase",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "homescreen",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "PassphraseSourceType",
                    "name": "passphrase_source",
                    "id": 5
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "auto_lock_delay_ms",
                    "id": 6
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "ApplyFlags",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "flags",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "ChangePin",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "remove",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "Ping",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "message",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "button_protection",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "pin_protection",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "passphrase_protection",
                    "id": 4
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "Success",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "message",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "Failure",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "FailureType",
                    "name": "code",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "message",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "ButtonRequest",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "ButtonRequestType",
                    "name": "code",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "data",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "ButtonAck",
            "fields": [],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "PinMatrixRequest",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "PinMatrixRequestType",
                    "name": "type",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "PinMatrixAck",
            "fields": [
                {
                    "rule": "required",
                    "options": {},
                    "type": "string",
                    "name": "pin",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "Cancel",
            "fields": [],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "PassphraseRequest",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "on_device",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "PassphraseAck",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "passphrase",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "state",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "PassphraseStateRequest",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "state",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "PassphraseStateAck",
            "fields": [],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "GetEntropy",
            "fields": [
                {
                    "rule": "required",
                    "options": {},
                    "type": "uint32",
                    "name": "size",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "Entropy",
            "fields": [
                {
                    "rule": "required",
                    "options": {},
                    "type": "bytes",
                    "name": "entropy",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "GetPublicKey",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "ecdsa_curve_name",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "show_display",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {
                        "default": "Bitcoin"
                    },
                    "type": "string",
                    "name": "coin_name",
                    "id": 4
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "PublicKey",
            "fields": [
                {
                    "rule": "required",
                    "options": {},
                    "type": "HDNodeType",
                    "name": "node",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "xpub",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "GetAddress",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {
                        "default": "Bitcoin"
                    },
                    "type": "string",
                    "name": "coin_name",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "show_display",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "MultisigRedeemScriptType",
                    "name": "multisig",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {
                        "default": "SPENDADDRESS"
                    },
                    "type": "InputScriptType",
                    "name": "script_type",
                    "id": 5
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "EthereumGetAddress",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "show_display",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "Address",
            "fields": [
                {
                    "rule": "required",
                    "options": {},
                    "type": "string",
                    "name": "address",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "EthereumAddress",
            "fields": [
                {
                    "rule": "required",
                    "options": {},
                    "type": "bytes",
                    "name": "address",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "WipeDevice",
            "fields": [],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "LoadDevice",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "mnemonic",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "HDNodeType",
                    "name": "node",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "pin",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "passphrase_protection",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {
                        "default": "english"
                    },
                    "type": "string",
                    "name": "language",
                    "id": 5
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "label",
                    "id": 6
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "skip_checksum",
                    "id": 7
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "u2f_counter",
                    "id": 8
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "ResetDevice",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "display_random",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {
                        "default": 256
                    },
                    "type": "uint32",
                    "name": "strength",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "passphrase_protection",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "pin_protection",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {
                        "default": "english"
                    },
                    "type": "string",
                    "name": "language",
                    "id": 5
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "label",
                    "id": 6
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "u2f_counter",
                    "id": 7
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "skip_backup",
                    "id": 8
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "BackupDevice",
            "fields": [],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "EntropyRequest",
            "fields": [],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "EntropyAck",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "entropy",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "RecoveryDevice",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "word_count",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "passphrase_protection",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "pin_protection",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {
                        "default": "english"
                    },
                    "type": "string",
                    "name": "language",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "label",
                    "id": 5
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "enforce_wordlist",
                    "id": 6
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "type",
                    "id": 8
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "u2f_counter",
                    "id": 9
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "dry_run",
                    "id": 10
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "WordRequest",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "WordRequestType",
                    "name": "type",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "WordAck",
            "fields": [
                {
                    "rule": "required",
                    "options": {},
                    "type": "string",
                    "name": "word",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "SignMessage",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 1
                },
                {
                    "rule": "required",
                    "options": {},
                    "type": "bytes",
                    "name": "message",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {
                        "default": "Bitcoin"
                    },
                    "type": "string",
                    "name": "coin_name",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {
                        "default": "SPENDADDRESS"
                    },
                    "type": "InputScriptType",
                    "name": "script_type",
                    "id": 4
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "VerifyMessage",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "address",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "signature",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "message",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {
                        "default": "Bitcoin"
                    },
                    "type": "string",
                    "name": "coin_name",
                    "id": 4
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "MessageSignature",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "address",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "signature",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "EncryptMessage",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "pubkey",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "message",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "display_only",
                    "id": 3
                },
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {
                        "default": "Bitcoin"
                    },
                    "type": "string",
                    "name": "coin_name",
                    "id": 5
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "EncryptedMessage",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "nonce",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "message",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "hmac",
                    "id": 3
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "DecryptMessage",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "nonce",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "message",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "hmac",
                    "id": 4
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "DecryptedMessage",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "message",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "address",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "CipherKeyValue",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "key",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "value",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "encrypt",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "ask_on_encrypt",
                    "id": 5
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "ask_on_decrypt",
                    "id": 6
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "iv",
                    "id": 7
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "CipheredKeyValue",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "value",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "EstimateTxSize",
            "fields": [
                {
                    "rule": "required",
                    "options": {},
                    "type": "uint32",
                    "name": "outputs_count",
                    "id": 1
                },
                {
                    "rule": "required",
                    "options": {},
                    "type": "uint32",
                    "name": "inputs_count",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {
                        "default": "Bitcoin"
                    },
                    "type": "string",
                    "name": "coin_name",
                    "id": 3
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "TxSize",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "tx_size",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "SignTx",
            "fields": [
                {
                    "rule": "required",
                    "options": {},
                    "type": "uint32",
                    "name": "outputs_count",
                    "id": 1
                },
                {
                    "rule": "required",
                    "options": {},
                    "type": "uint32",
                    "name": "inputs_count",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {
                        "default": "Bitcoin"
                    },
                    "type": "string",
                    "name": "coin_name",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {
                        "default": 1
                    },
                    "type": "uint32",
                    "name": "version",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {
                        "default": 0
                    },
                    "type": "uint32",
                    "name": "lock_time",
                    "id": 5
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "expiry",
                    "id": 6
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "overwintered",
                    "id": 7
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "SimpleSignTx",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "TxInputType",
                    "name": "inputs",
                    "id": 1
                },
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "TxOutputType",
                    "name": "outputs",
                    "id": 2
                },
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "TransactionType",
                    "name": "transactions",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {
                        "default": "Bitcoin"
                    },
                    "type": "string",
                    "name": "coin_name",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {
                        "default": 1
                    },
                    "type": "uint32",
                    "name": "version",
                    "id": 5
                },
                {
                    "rule": "optional",
                    "options": {
                        "default": 0
                    },
                    "type": "uint32",
                    "name": "lock_time",
                    "id": 6
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "expiry",
                    "id": 7
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "overwintered",
                    "id": 8
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "TxRequest",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "RequestType",
                    "name": "request_type",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "TxRequestDetailsType",
                    "name": "details",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "TxRequestSerializedType",
                    "name": "serialized",
                    "id": 3
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "TxAck",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "TransactionType",
                    "name": "tx",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "EthereumSignTx",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "nonce",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "gas_price",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "gas_limit",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "to",
                    "id": 5
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "value",
                    "id": 6
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "data_initial_chunk",
                    "id": 7
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "data_length",
                    "id": 8
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "chain_id",
                    "id": 9
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "tx_type",
                    "id": 10
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "EthereumTxRequest",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "data_length",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "signature_v",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "signature_r",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "signature_s",
                    "id": 4
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "EthereumTxAck",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "data_chunk",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "EthereumSignMessage",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 1
                },
                {
                    "rule": "required",
                    "options": {},
                    "type": "bytes",
                    "name": "message",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "EthereumVerifyMessage",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "address",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "signature",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "message",
                    "id": 3
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "EthereumMessageSignature",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "address",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "signature",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "SignIdentity",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "IdentityType",
                    "name": "identity",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "challenge_hidden",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "challenge_visual",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "ecdsa_curve_name",
                    "id": 4
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "SignedIdentity",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "address",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "public_key",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "signature",
                    "id": 3
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "GetECDHSessionKey",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "IdentityType",
                    "name": "identity",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "peer_public_key",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "ecdsa_curve_name",
                    "id": 3
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "ECDHSessionKey",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "session_key",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "SetU2FCounter",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "u2f_counter",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "FirmwareErase",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "length",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "FirmwareRequest",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "offset",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "length",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "FirmwareUpload",
            "fields": [
                {
                    "rule": "required",
                    "options": {},
                    "type": "bytes",
                    "name": "payload",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "hash",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "SelfTest",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "payload",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "NEMGetAddress",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "network",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "show_display",
                    "id": 3
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "NEMAddress",
            "fields": [
                {
                    "rule": "required",
                    "options": {},
                    "type": "string",
                    "name": "address",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "NEMSignTx",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "NEMTransactionCommon",
                    "name": "transaction",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "NEMTransactionCommon",
                    "name": "multisig",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "NEMTransfer",
                    "name": "transfer",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "cosigning",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "NEMProvisionNamespace",
                    "name": "provision_namespace",
                    "id": 5
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "NEMMosaicCreation",
                    "name": "mosaic_creation",
                    "id": 6
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "NEMMosaicSupplyChange",
                    "name": "supply_change",
                    "id": 7
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "NEMAggregateModification",
                    "name": "aggregate_modification",
                    "id": 8
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "NEMImportanceTransfer",
                    "name": "importance_transfer",
                    "id": 9
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "NEMSignedTx",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "data",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "signature",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "NEMDecryptMessage",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "network",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "public_key",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "payload",
                    "id": 4
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "NEMDecryptedMessage",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "payload",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "CosiCommit",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "data",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "CosiCommitment",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "commitment",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "pubkey",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "CosiSign",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "data",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "global_commitment",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "global_pubkey",
                    "id": 4
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "CosiSignature",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "signature",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "StellarGetPublicKey",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "show_display",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "StellarPublicKey",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "public_key",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "StellarGetAddress",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "show_display",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "StellarAddress",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "address",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "StellarSignTx",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "protocol_version",
                    "id": 1
                },
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "network_passphrase",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "source_account",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "fee",
                    "id": 5
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint64",
                    "name": "sequence_number",
                    "id": 6
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "timebounds_start",
                    "id": 8
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "timebounds_end",
                    "id": 9
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "memo_type",
                    "id": 10
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "memo_text",
                    "id": 11
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint64",
                    "name": "memo_id",
                    "id": 12
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "memo_hash",
                    "id": 13
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "num_operations",
                    "id": 14
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "StellarTxOpRequest",
            "fields": [],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "StellarPaymentOp",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "source_account",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "destination_account",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "StellarAssetType",
                    "name": "asset",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "sint64",
                    "name": "amount",
                    "id": 4
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "StellarCreateAccountOp",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "source_account",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "new_account",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "sint64",
                    "name": "starting_balance",
                    "id": 3
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "StellarPathPaymentOp",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "source_account",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "StellarAssetType",
                    "name": "send_asset",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "sint64",
                    "name": "send_max",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "destination_account",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "StellarAssetType",
                    "name": "destination_asset",
                    "id": 5
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "sint64",
                    "name": "destination_amount",
                    "id": 6
                },
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "StellarAssetType",
                    "name": "paths",
                    "id": 7
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "StellarManageOfferOp",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "source_account",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "StellarAssetType",
                    "name": "selling_asset",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "StellarAssetType",
                    "name": "buying_asset",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "sint64",
                    "name": "amount",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "price_n",
                    "id": 5
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "price_d",
                    "id": 6
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint64",
                    "name": "offer_id",
                    "id": 7
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "StellarCreatePassiveOfferOp",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "source_account",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "StellarAssetType",
                    "name": "selling_asset",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "StellarAssetType",
                    "name": "buying_asset",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "sint64",
                    "name": "amount",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "price_n",
                    "id": 5
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "price_d",
                    "id": 6
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "StellarSetOptionsOp",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "source_account",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "inflation_destination_account",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "clear_flags",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "set_flags",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "master_weight",
                    "id": 5
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "low_threshold",
                    "id": 6
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "medium_threshold",
                    "id": 7
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "high_threshold",
                    "id": 8
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "home_domain",
                    "id": 9
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "signer_type",
                    "id": 10
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "signer_key",
                    "id": 11
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "signer_weight",
                    "id": 12
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "StellarChangeTrustOp",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "source_account",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "StellarAssetType",
                    "name": "asset",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint64",
                    "name": "limit",
                    "id": 3
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "StellarAllowTrustOp",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "source_account",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "trusted_account",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "asset_type",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "asset_code",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "is_authorized",
                    "id": 5
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "StellarAccountMergeOp",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "source_account",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "destination_account",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "StellarManageDataOp",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "source_account",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "key",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "value",
                    "id": 3
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "StellarBumpSequenceOp",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "source_account",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint64",
                    "name": "bump_to",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "StellarSignedTx",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "public_key",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "signature",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "LiskGetPublicKey",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "show_display",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "LiskPublicKey",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "public_key",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "LiskGetAddress",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "show_display",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "LiskAddress",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "address",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "LiskSignTx",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "LiskTransactionCommon",
                    "name": "transaction",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "LiskSignedTx",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "signature",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "LiskSignMessage",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "uint32",
                    "name": "address_n",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "message",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "LiskMessageSignature",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "public_key",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "signature",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "LiskVerifyMessage",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "public_key",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "signature",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "message",
                    "id": 3
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "DebugLinkDecision",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "yes_no",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "up_down",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "input",
                    "id": 3
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "DebugLinkGetState",
            "fields": [],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "DebugLinkState",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "layout",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "pin",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "matrix",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "mnemonic",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "HDNodeType",
                    "name": "node",
                    "id": 5
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "passphrase_protection",
                    "id": 6
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "reset_word",
                    "id": 7
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "reset_entropy",
                    "id": 8
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "recovery_fake_word",
                    "id": 9
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "recovery_word_pos",
                    "id": 10
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "reset_word_pos",
                    "id": 11
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "DebugLinkStop",
            "fields": [],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "DebugLinkLog",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "level",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "bucket",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "text",
                    "id": 3
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "DebugLinkMemoryRead",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "address",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "length",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "DebugLinkMemory",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "memory",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "DebugLinkMemoryWrite",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "address",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "memory",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bool",
                    "name": "flash",
                    "id": 3
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "DebugLinkFlashErase",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "sector",
                    "id": 1
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        }
    ],
    "enums": [
        {
            "name": "MessageType",
            "values": [
                {
                    "name": "MessageType_Initialize",
                    "id": 0
                },
                {
                    "name": "MessageType_Ping",
                    "id": 1
                },
                {
                    "name": "MessageType_Success",
                    "id": 2
                },
                {
                    "name": "MessageType_Failure",
                    "id": 3
                },
                {
                    "name": "MessageType_ChangePin",
                    "id": 4
                },
                {
                    "name": "MessageType_WipeDevice",
                    "id": 5
                },
                {
                    "name": "MessageType_FirmwareErase",
                    "id": 6
                },
                {
                    "name": "MessageType_FirmwareUpload",
                    "id": 7
                },
                {
                    "name": "MessageType_FirmwareRequest",
                    "id": 8
                },
                {
                    "name": "MessageType_GetEntropy",
                    "id": 9
                },
                {
                    "name": "MessageType_Entropy",
                    "id": 10
                },
                {
                    "name": "MessageType_GetPublicKey",
                    "id": 11
                },
                {
                    "name": "MessageType_PublicKey",
                    "id": 12
                },
                {
                    "name": "MessageType_LoadDevice",
                    "id": 13
                },
                {
                    "name": "MessageType_ResetDevice",
                    "id": 14
                },
                {
                    "name": "MessageType_SignTx",
                    "id": 15
                },
                {
                    "name": "MessageType_SimpleSignTx",
                    "id": 16
                },
                {
                    "name": "MessageType_Features",
                    "id": 17
                },
                {
                    "name": "MessageType_PinMatrixRequest",
                    "id": 18
                },
                {
                    "name": "MessageType_PinMatrixAck",
                    "id": 19
                },
                {
                    "name": "MessageType_Cancel",
                    "id": 20
                },
                {
                    "name": "MessageType_TxRequest",
                    "id": 21
                },
                {
                    "name": "MessageType_TxAck",
                    "id": 22
                },
                {
                    "name": "MessageType_CipherKeyValue",
                    "id": 23
                },
                {
                    "name": "MessageType_ClearSession",
                    "id": 24
                },
                {
                    "name": "MessageType_ApplySettings",
                    "id": 25
                },
                {
                    "name": "MessageType_ButtonRequest",
                    "id": 26
                },
                {
                    "name": "MessageType_ButtonAck",
                    "id": 27
                },
                {
                    "name": "MessageType_ApplyFlags",
                    "id": 28
                },
                {
                    "name": "MessageType_GetAddress",
                    "id": 29
                },
                {
                    "name": "MessageType_Address",
                    "id": 30
                },
                {
                    "name": "MessageType_SelfTest",
                    "id": 32
                },
                {
                    "name": "MessageType_BackupDevice",
                    "id": 34
                },
                {
                    "name": "MessageType_EntropyRequest",
                    "id": 35
                },
                {
                    "name": "MessageType_EntropyAck",
                    "id": 36
                },
                {
                    "name": "MessageType_SignMessage",
                    "id": 38
                },
                {
                    "name": "MessageType_VerifyMessage",
                    "id": 39
                },
                {
                    "name": "MessageType_MessageSignature",
                    "id": 40
                },
                {
                    "name": "MessageType_PassphraseRequest",
                    "id": 41
                },
                {
                    "name": "MessageType_PassphraseAck",
                    "id": 42
                },
                {
                    "name": "MessageType_PassphraseStateRequest",
                    "id": 77
                },
                {
                    "name": "MessageType_PassphraseStateAck",
                    "id": 78
                },
                {
                    "name": "MessageType_EstimateTxSize",
                    "id": 43
                },
                {
                    "name": "MessageType_TxSize",
                    "id": 44
                },
                {
                    "name": "MessageType_RecoveryDevice",
                    "id": 45
                },
                {
                    "name": "MessageType_WordRequest",
                    "id": 46
                },
                {
                    "name": "MessageType_WordAck",
                    "id": 47
                },
                {
                    "name": "MessageType_CipheredKeyValue",
                    "id": 48
                },
                {
                    "name": "MessageType_EncryptMessage",
                    "id": 49
                },
                {
                    "name": "MessageType_EncryptedMessage",
                    "id": 50
                },
                {
                    "name": "MessageType_DecryptMessage",
                    "id": 51
                },
                {
                    "name": "MessageType_DecryptedMessage",
                    "id": 52
                },
                {
                    "name": "MessageType_SignIdentity",
                    "id": 53
                },
                {
                    "name": "MessageType_SignedIdentity",
                    "id": 54
                },
                {
                    "name": "MessageType_GetFeatures",
                    "id": 55
                },
                {
                    "name": "MessageType_EthereumGetAddress",
                    "id": 56
                },
                {
                    "name": "MessageType_EthereumAddress",
                    "id": 57
                },
                {
                    "name": "MessageType_EthereumSignTx",
                    "id": 58
                },
                {
                    "name": "MessageType_EthereumTxRequest",
                    "id": 59
                },
                {
                    "name": "MessageType_EthereumTxAck",
                    "id": 60
                },
                {
                    "name": "MessageType_GetECDHSessionKey",
                    "id": 61
                },
                {
                    "name": "MessageType_ECDHSessionKey",
                    "id": 62
                },
                {
                    "name": "MessageType_SetU2FCounter",
                    "id": 63
                },
                {
                    "name": "MessageType_EthereumSignMessage",
                    "id": 64
                },
                {
                    "name": "MessageType_EthereumVerifyMessage",
                    "id": 65
                },
                {
                    "name": "MessageType_EthereumMessageSignature",
                    "id": 66
                },
                {
                    "name": "MessageType_NEMGetAddress",
                    "id": 67
                },
                {
                    "name": "MessageType_NEMAddress",
                    "id": 68
                },
                {
                    "name": "MessageType_NEMSignTx",
                    "id": 69
                },
                {
                    "name": "MessageType_NEMSignedTx",
                    "id": 70
                },
                {
                    "name": "MessageType_CosiCommit",
                    "id": 71
                },
                {
                    "name": "MessageType_CosiCommitment",
                    "id": 72
                },
                {
                    "name": "MessageType_CosiSign",
                    "id": 73
                },
                {
                    "name": "MessageType_CosiSignature",
                    "id": 74
                },
                {
                    "name": "MessageType_NEMDecryptMessage",
                    "id": 75
                },
                {
                    "name": "MessageType_NEMDecryptedMessage",
                    "id": 76
                },
                {
                    "name": "MessageType_DebugLinkDecision",
                    "id": 100
                },
                {
                    "name": "MessageType_DebugLinkGetState",
                    "id": 101
                },
                {
                    "name": "MessageType_DebugLinkState",
                    "id": 102
                },
                {
                    "name": "MessageType_DebugLinkStop",
                    "id": 103
                },
                {
                    "name": "MessageType_DebugLinkLog",
                    "id": 104
                },
                {
                    "name": "MessageType_DebugLinkMemoryRead",
                    "id": 110
                },
                {
                    "name": "MessageType_DebugLinkMemory",
                    "id": 111
                },
                {
                    "name": "MessageType_DebugLinkMemoryWrite",
                    "id": 112
                },
                {
                    "name": "MessageType_DebugLinkFlashErase",
                    "id": 113
                },
                {
                    "name": "MessageType_LiskGetAddress",
                    "id": 114
                },
                {
                    "name": "MessageType_LiskAddress",
                    "id": 115
                },
                {
                    "name": "MessageType_LiskSignTx",
                    "id": 116
                },
                {
                    "name": "MessageType_LiskSignedTx",
                    "id": 117
                },
                {
                    "name": "MessageType_LiskSignMessage",
                    "id": 118
                },
                {
                    "name": "MessageType_LiskMessageSignature",
                    "id": 119
                },
                {
                    "name": "MessageType_LiskVerifyMessage",
                    "id": 120
                },
                {
                    "name": "MessageType_LiskGetPublicKey",
                    "id": 121
                },
                {
                    "name": "MessageType_LiskPublicKey",
                    "id": 122
                },
                {
                    "name": "MessageType_StellarGetPublicKey",
                    "id": 200
                },
                {
                    "name": "MessageType_StellarPublicKey",
                    "id": 201
                },
                {
                    "name": "MessageType_StellarSignTx",
                    "id": 202
                },
                {
                    "name": "MessageType_StellarTxOpRequest",
                    "id": 203
                },
                {
                    "name": "MessageType_StellarGetAddress",
                    "id": 207
                },
                {
                    "name": "MessageType_StellarAddress",
                    "id": 208
                },
                {
                    "name": "MessageType_StellarCreateAccountOp",
                    "id": 210
                },
                {
                    "name": "MessageType_StellarPaymentOp",
                    "id": 211
                },
                {
                    "name": "MessageType_StellarPathPaymentOp",
                    "id": 212
                },
                {
                    "name": "MessageType_StellarManageOfferOp",
                    "id": 213
                },
                {
                    "name": "MessageType_StellarCreatePassiveOfferOp",
                    "id": 214
                },
                {
                    "name": "MessageType_StellarSetOptionsOp",
                    "id": 215
                },
                {
                    "name": "MessageType_StellarChangeTrustOp",
                    "id": 216
                },
                {
                    "name": "MessageType_StellarAllowTrustOp",
                    "id": 217
                },
                {
                    "name": "MessageType_StellarAccountMergeOp",
                    "id": 218
                },
                {
                    "name": "MessageType_StellarManageDataOp",
                    "id": 220
                },
                {
                    "name": "MessageType_StellarBumpSequenceOp",
                    "id": 221
                },
                {
                    "name": "MessageType_StellarSignedTx",
                    "id": 230
                }
            ],
            "options": {}
        }
    ],
    "imports": [
        {
            "package": null,
            "messages": [
                {
                    "ref": "google.protobuf.EnumValueOptions",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bool",
                            "name": "wire_in",
                            "id": 50002
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bool",
                            "name": "wire_out",
                            "id": 50003
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bool",
                            "name": "wire_debug_in",
                            "id": 50004
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bool",
                            "name": "wire_debug_out",
                            "id": 50005
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bool",
                            "name": "wire_tiny",
                            "id": 50006
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bool",
                            "name": "wire_bootloader",
                            "id": 50007
                        }
                    ]
                },
                {
                    "name": "HDNodeType",
                    "fields": [
                        {
                            "rule": "required",
                            "options": {},
                            "type": "uint32",
                            "name": "depth",
                            "id": 1
                        },
                        {
                            "rule": "required",
                            "options": {},
                            "type": "uint32",
                            "name": "fingerprint",
                            "id": 2
                        },
                        {
                            "rule": "required",
                            "options": {},
                            "type": "uint32",
                            "name": "child_num",
                            "id": 3
                        },
                        {
                            "rule": "required",
                            "options": {},
                            "type": "bytes",
                            "name": "chain_code",
                            "id": 4
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "private_key",
                            "id": 5
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "public_key",
                            "id": 6
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "HDNodePathType",
                    "fields": [
                        {
                            "rule": "required",
                            "options": {},
                            "type": "HDNodeType",
                            "name": "node",
                            "id": 1
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "uint32",
                            "name": "address_n",
                            "id": 2
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "MultisigRedeemScriptType",
                    "fields": [
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "HDNodePathType",
                            "name": "pubkeys",
                            "id": 1
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "bytes",
                            "name": "signatures",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "m",
                            "id": 3
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "TxInputType",
                    "fields": [
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "uint32",
                            "name": "address_n",
                            "id": 1
                        },
                        {
                            "rule": "required",
                            "options": {},
                            "type": "bytes",
                            "name": "prev_hash",
                            "id": 2
                        },
                        {
                            "rule": "required",
                            "options": {},
                            "type": "uint32",
                            "name": "prev_index",
                            "id": 3
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "script_sig",
                            "id": 4
                        },
                        {
                            "rule": "optional",
                            "options": {
                                "default": 4294967295
                            },
                            "type": "uint32",
                            "name": "sequence",
                            "id": 5
                        },
                        {
                            "rule": "optional",
                            "options": {
                                "default": "SPENDADDRESS"
                            },
                            "type": "InputScriptType",
                            "name": "script_type",
                            "id": 6
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "MultisigRedeemScriptType",
                            "name": "multisig",
                            "id": 7
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint64",
                            "name": "amount",
                            "id": 8
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "decred_tree",
                            "id": 9
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "decred_script_version",
                            "id": 10
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "TxOutputType",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "address",
                            "id": 1
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "uint32",
                            "name": "address_n",
                            "id": 2
                        },
                        {
                            "rule": "required",
                            "options": {},
                            "type": "uint64",
                            "name": "amount",
                            "id": 3
                        },
                        {
                            "rule": "required",
                            "options": {},
                            "type": "OutputScriptType",
                            "name": "script_type",
                            "id": 4
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "MultisigRedeemScriptType",
                            "name": "multisig",
                            "id": 5
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "op_return_data",
                            "id": 6
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "decred_script_version",
                            "id": 7
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "TxOutputBinType",
                    "fields": [
                        {
                            "rule": "required",
                            "options": {},
                            "type": "uint64",
                            "name": "amount",
                            "id": 1
                        },
                        {
                            "rule": "required",
                            "options": {},
                            "type": "bytes",
                            "name": "script_pubkey",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "decred_script_version",
                            "id": 3
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "TransactionType",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "version",
                            "id": 1
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "TxInputType",
                            "name": "inputs",
                            "id": 2
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "TxOutputBinType",
                            "name": "bin_outputs",
                            "id": 3
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "TxOutputType",
                            "name": "outputs",
                            "id": 5
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "lock_time",
                            "id": 4
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "inputs_cnt",
                            "id": 6
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "outputs_cnt",
                            "id": 7
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "extra_data",
                            "id": 8
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "extra_data_len",
                            "id": 9
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "expiry",
                            "id": 10
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bool",
                            "name": "overwintered",
                            "id": 11
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "TxRequestDetailsType",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "request_index",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "tx_hash",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "extra_data_len",
                            "id": 3
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "extra_data_offset",
                            "id": 4
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "TxRequestSerializedType",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "signature_index",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "signature",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "serialized_tx",
                            "id": 3
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "IdentityType",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "proto",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "user",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "host",
                            "id": 3
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "port",
                            "id": 4
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "path",
                            "id": 5
                        },
                        {
                            "rule": "optional",
                            "options": {
                                "default": 0
                            },
                            "type": "uint32",
                            "name": "index",
                            "id": 6
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "NEMTransactionCommon",
                    "fields": [
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "uint32",
                            "name": "address_n",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "network",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "timestamp",
                            "id": 3
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint64",
                            "name": "fee",
                            "id": 4
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "deadline",
                            "id": 5
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "signer",
                            "id": 6
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "NEMTransfer",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "recipient",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint64",
                            "name": "amount",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "payload",
                            "id": 3
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "public_key",
                            "id": 4
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "NEMMosaic",
                            "name": "mosaics",
                            "id": 5
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "NEMMosaic",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "namespace",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "mosaic",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint64",
                            "name": "quantity",
                            "id": 3
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "NEMProvisionNamespace",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "namespace",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "parent",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "sink",
                            "id": 3
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint64",
                            "name": "fee",
                            "id": 4
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "NEMMosaicCreation",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "NEMMosaicDefinition",
                            "name": "definition",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "sink",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint64",
                            "name": "fee",
                            "id": 3
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "NEMMosaicDefinition",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "name",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "ticker",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "namespace",
                            "id": 3
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "mosaic",
                            "id": 4
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "divisibility",
                            "id": 5
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "NEMMosaicLevy",
                            "name": "levy",
                            "id": 6
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint64",
                            "name": "fee",
                            "id": 7
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "levy_address",
                            "id": 8
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "levy_namespace",
                            "id": 9
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "levy_mosaic",
                            "id": 10
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint64",
                            "name": "supply",
                            "id": 11
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bool",
                            "name": "mutable_supply",
                            "id": 12
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bool",
                            "name": "transferable",
                            "id": 13
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "description",
                            "id": 14
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "uint32",
                            "name": "networks",
                            "id": 15
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "NEMMosaicSupplyChange",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "namespace",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "mosaic",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "NEMSupplyChangeType",
                            "name": "type",
                            "id": 3
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint64",
                            "name": "delta",
                            "id": 4
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "NEMAggregateModification",
                    "fields": [
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "NEMCosignatoryModification",
                            "name": "modifications",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "sint32",
                            "name": "relative_change",
                            "id": 2
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "NEMCosignatoryModification",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "NEMModificationType",
                            "name": "type",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "public_key",
                            "id": 2
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "NEMImportanceTransfer",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "NEMImportanceTransferMode",
                            "name": "mode",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "public_key",
                            "id": 2
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "StellarAssetType",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "type",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "code",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "issuer",
                            "id": 3
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "LiskTransactionCommon",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "LiskTransactionType",
                            "name": "type",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {
                                "default": 0
                            },
                            "type": "uint64",
                            "name": "amount",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint64",
                            "name": "fee",
                            "id": 3
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "recipient_id",
                            "id": 4
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "sender_public_key",
                            "id": 5
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "requester_public_key",
                            "id": 6
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "signature",
                            "id": 7
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "timestamp",
                            "id": 8
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "LiskTransactionAsset",
                            "name": "asset",
                            "id": 9
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "LiskTransactionAsset",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "LiskSignatureType",
                            "name": "signature",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "LiskDelegateType",
                            "name": "delegate",
                            "id": 2
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "string",
                            "name": "votes",
                            "id": 3
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "LiskMultisignatureType",
                            "name": "multisignature",
                            "id": 4
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "data",
                            "id": 5
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "LiskSignatureType",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "public_key",
                            "id": 1
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "LiskDelegateType",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "username",
                            "id": 1
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "LiskMultisignatureType",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "min",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint32",
                            "name": "life_time",
                            "id": 2
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "string",
                            "name": "keys_group",
                            "id": 3
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                }
            ],
            "enums": [
                {
                    "name": "FailureType",
                    "values": [
                        {
                            "name": "Failure_UnexpectedMessage",
                            "id": 1
                        },
                        {
                            "name": "Failure_ButtonExpected",
                            "id": 2
                        },
                        {
                            "name": "Failure_DataError",
                            "id": 3
                        },
                        {
                            "name": "Failure_ActionCancelled",
                            "id": 4
                        },
                        {
                            "name": "Failure_PinExpected",
                            "id": 5
                        },
                        {
                            "name": "Failure_PinCancelled",
                            "id": 6
                        },
                        {
                            "name": "Failure_PinInvalid",
                            "id": 7
                        },
                        {
                            "name": "Failure_InvalidSignature",
                            "id": 8
                        },
                        {
                            "name": "Failure_ProcessError",
                            "id": 9
                        },
                        {
                            "name": "Failure_NotEnoughFunds",
                            "id": 10
                        },
                        {
                            "name": "Failure_NotInitialized",
                            "id": 11
                        },
                        {
                            "name": "Failure_PinMismatch",
                            "id": 12
                        },
                        {
                            "name": "Failure_FirmwareError",
                            "id": 99
                        }
                    ],
                    "options": {}
                },
                {
                    "name": "OutputScriptType",
                    "values": [
                        {
                            "name": "PAYTOADDRESS",
                            "id": 0
                        },
                        {
                            "name": "PAYTOSCRIPTHASH",
                            "id": 1
                        },
                        {
                            "name": "PAYTOMULTISIG",
                            "id": 2
                        },
                        {
                            "name": "PAYTOOPRETURN",
                            "id": 3
                        },
                        {
                            "name": "PAYTOWITNESS",
                            "id": 4
                        },
                        {
                            "name": "PAYTOP2SHWITNESS",
                            "id": 5
                        }
                    ],
                    "options": {}
                },
                {
                    "name": "InputScriptType",
                    "values": [
                        {
                            "name": "SPENDADDRESS",
                            "id": 0
                        },
                        {
                            "name": "SPENDMULTISIG",
                            "id": 1
                        },
                        {
                            "name": "EXTERNAL",
                            "id": 2
                        },
                        {
                            "name": "SPENDWITNESS",
                            "id": 3
                        },
                        {
                            "name": "SPENDP2SHWITNESS",
                            "id": 4
                        }
                    ],
                    "options": {}
                },
                {
                    "name": "RequestType",
                    "values": [
                        {
                            "name": "TXINPUT",
                            "id": 0
                        },
                        {
                            "name": "TXOUTPUT",
                            "id": 1
                        },
                        {
                            "name": "TXMETA",
                            "id": 2
                        },
                        {
                            "name": "TXFINISHED",
                            "id": 3
                        },
                        {
                            "name": "TXEXTRADATA",
                            "id": 4
                        }
                    ],
                    "options": {}
                },
                {
                    "name": "ButtonRequestType",
                    "values": [
                        {
                            "name": "ButtonRequest_Other",
                            "id": 1
                        },
                        {
                            "name": "ButtonRequest_FeeOverThreshold",
                            "id": 2
                        },
                        {
                            "name": "ButtonRequest_ConfirmOutput",
                            "id": 3
                        },
                        {
                            "name": "ButtonRequest_ResetDevice",
                            "id": 4
                        },
                        {
                            "name": "ButtonRequest_ConfirmWord",
                            "id": 5
                        },
                        {
                            "name": "ButtonRequest_WipeDevice",
                            "id": 6
                        },
                        {
                            "name": "ButtonRequest_ProtectCall",
                            "id": 7
                        },
                        {
                            "name": "ButtonRequest_SignTx",
                            "id": 8
                        },
                        {
                            "name": "ButtonRequest_FirmwareCheck",
                            "id": 9
                        },
                        {
                            "name": "ButtonRequest_Address",
                            "id": 10
                        },
                        {
                            "name": "ButtonRequest_PublicKey",
                            "id": 11
                        },
                        {
                            "name": "ButtonRequest_MnemonicWordCount",
                            "id": 12
                        },
                        {
                            "name": "ButtonRequest_MnemonicInput",
                            "id": 13
                        },
                        {
                            "name": "ButtonRequest_PassphraseType",
                            "id": 14
                        }
                    ],
                    "options": {}
                },
                {
                    "name": "PinMatrixRequestType",
                    "values": [
                        {
                            "name": "PinMatrixRequestType_Current",
                            "id": 1
                        },
                        {
                            "name": "PinMatrixRequestType_NewFirst",
                            "id": 2
                        },
                        {
                            "name": "PinMatrixRequestType_NewSecond",
                            "id": 3
                        }
                    ],
                    "options": {}
                },
                {
                    "name": "RecoveryDeviceType",
                    "values": [
                        {
                            "name": "RecoveryDeviceType_ScrambledWords",
                            "id": 0
                        },
                        {
                            "name": "RecoveryDeviceType_Matrix",
                            "id": 1
                        }
                    ],
                    "options": {}
                },
                {
                    "name": "WordRequestType",
                    "values": [
                        {
                            "name": "WordRequestType_Plain",
                            "id": 0
                        },
                        {
                            "name": "WordRequestType_Matrix9",
                            "id": 1
                        },
                        {
                            "name": "WordRequestType_Matrix6",
                            "id": 2
                        }
                    ],
                    "options": {}
                },
                {
                    "name": "PassphraseSourceType",
                    "values": [
                        {
                            "name": "ASK",
                            "id": 0
                        },
                        {
                            "name": "DEVICE",
                            "id": 1
                        },
                        {
                            "name": "HOST",
                            "id": 2
                        }
                    ],
                    "options": {}
                },
                {
                    "name": "NEMMosaicLevy",
                    "values": [
                        {
                            "name": "MosaicLevy_Absolute",
                            "id": 1
                        },
                        {
                            "name": "MosaicLevy_Percentile",
                            "id": 2
                        }
                    ],
                    "options": {}
                },
                {
                    "name": "NEMSupplyChangeType",
                    "values": [
                        {
                            "name": "SupplyChange_Increase",
                            "id": 1
                        },
                        {
                            "name": "SupplyChange_Decrease",
                            "id": 2
                        }
                    ],
                    "options": {}
                },
                {
                    "name": "NEMModificationType",
                    "values": [
                        {
                            "name": "CosignatoryModification_Add",
                            "id": 1
                        },
                        {
                            "name": "CosignatoryModification_Delete",
                            "id": 2
                        }
                    ],
                    "options": {}
                },
                {
                    "name": "NEMImportanceTransferMode",
                    "values": [
                        {
                            "name": "ImportanceTransfer_Activate",
                            "id": 1
                        },
                        {
                            "name": "ImportanceTransfer_Deactivate",
                            "id": 2
                        }
                    ],
                    "options": {}
                },
                {
                    "name": "LiskTransactionType",
                    "values": [
                        {
                            "name": "Transfer",
                            "id": 0
                        },
                        {
                            "name": "RegisterSecondPassphrase",
                            "id": 1
                        },
                        {
                            "name": "RegisterDelegate",
                            "id": 2
                        },
                        {
                            "name": "CastVotes",
                            "id": 3
                        },
                        {
                            "name": "RegisterMultisignatureAccount",
                            "id": 4
                        },
                        {
                            "name": "CreateDapp",
                            "id": 5
                        },
                        {
                            "name": "TransferIntoDapp",
                            "id": 6
                        },
                        {
                            "name": "TransferOutOfDapp",
                            "id": 7
                        }
                    ],
                    "options": {}
                }
            ],
            "imports": [],
            "options": {
                "java_package": "com.satoshilabs.trezor.lib.protobuf",
                "java_outer_classname": "TrezorType"
            },
            "services": []
        }
    ],
    "options": {
        "java_package": "com.satoshilabs.trezor.lib.protobuf",
        "java_outer_classname": "TrezorMessage"
    },
    "services": []
}
