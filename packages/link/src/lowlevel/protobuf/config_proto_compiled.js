/* @flow weak */

/*
 re-build this by:

sed 's/\(google\/protobuf\)/\.\/\1/' trezor-common/protob/config.proto > trezor-common/protob/config_fixed.proto
$(npm bin)/proto2js trezor-common/protob/config_fixed.proto -commonjs > config_proto_compiled.js
rm trezor-common/protob/config_fixed.proto

given trezor-common is from github trezor-common

the config.proto is not changed much

*/
module.exports = require("protobufjs-old-fixed-webpack").newBuilder({})["import"]({
    "package": null,
    "messages": [
        {
            "name": "DeviceDescriptor",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "vendor_id",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "product_id",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "serial_number",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "path",
                    "id": 4
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "Configuration",
            "fields": [
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "string",
                    "name": "whitelist_urls",
                    "id": 1
                },
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "string",
                    "name": "blacklist_urls",
                    "id": 2
                },
                {
                    "rule": "required",
                    "options": {},
                    "type": "google.protobuf.FileDescriptorSet",
                    "name": "wire_protocol",
                    "id": 3
                },
                {
                    "rule": "repeated",
                    "options": {},
                    "type": "DeviceDescriptor",
                    "name": "known_devices",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "uint32",
                    "name": "valid_until",
                    "id": 5
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        }
    ],
    "enums": [],
    "imports": [
        {
            "package": "google.protobuf",
            "messages": [
                {
                    "name": "FileDescriptorSet",
                    "fields": [
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "FileDescriptorProto",
                            "name": "file",
                            "id": 1
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "FileDescriptorProto",
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
                            "name": "package",
                            "id": 2
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "string",
                            "name": "dependency",
                            "id": 3
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "int32",
                            "name": "public_dependency",
                            "id": 10
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "int32",
                            "name": "weak_dependency",
                            "id": 11
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "DescriptorProto",
                            "name": "message_type",
                            "id": 4
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "EnumDescriptorProto",
                            "name": "enum_type",
                            "id": 5
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "ServiceDescriptorProto",
                            "name": "service",
                            "id": 6
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "FieldDescriptorProto",
                            "name": "extension",
                            "id": 7
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "FileOptions",
                            "name": "options",
                            "id": 8
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "SourceCodeInfo",
                            "name": "source_code_info",
                            "id": 9
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "DescriptorProto",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "name",
                            "id": 1
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "FieldDescriptorProto",
                            "name": "field",
                            "id": 2
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "FieldDescriptorProto",
                            "name": "extension",
                            "id": 6
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "DescriptorProto",
                            "name": "nested_type",
                            "id": 3
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "EnumDescriptorProto",
                            "name": "enum_type",
                            "id": 4
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "ExtensionRange",
                            "name": "extension_range",
                            "id": 5
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "MessageOptions",
                            "name": "options",
                            "id": 7
                        }
                    ],
                    "enums": [],
                    "messages": [
                        {
                            "name": "ExtensionRange",
                            "fields": [
                                {
                                    "rule": "optional",
                                    "options": {},
                                    "type": "int32",
                                    "name": "start",
                                    "id": 1
                                },
                                {
                                    "rule": "optional",
                                    "options": {},
                                    "type": "int32",
                                    "name": "end",
                                    "id": 2
                                }
                            ],
                            "enums": [],
                            "messages": [],
                            "options": {},
                            "oneofs": {}
                        }
                    ],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "FieldDescriptorProto",
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
                            "type": "int32",
                            "name": "number",
                            "id": 3
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "Label",
                            "name": "label",
                            "id": 4
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "Type",
                            "name": "type",
                            "id": 5
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "type_name",
                            "id": 6
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "extendee",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "default_value",
                            "id": 7
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "FieldOptions",
                            "name": "options",
                            "id": 8
                        }
                    ],
                    "enums": [
                        {
                            "name": "Type",
                            "values": [
                                {
                                    "name": "TYPE_DOUBLE",
                                    "id": 1
                                },
                                {
                                    "name": "TYPE_FLOAT",
                                    "id": 2
                                },
                                {
                                    "name": "TYPE_INT64",
                                    "id": 3
                                },
                                {
                                    "name": "TYPE_UINT64",
                                    "id": 4
                                },
                                {
                                    "name": "TYPE_INT32",
                                    "id": 5
                                },
                                {
                                    "name": "TYPE_FIXED64",
                                    "id": 6
                                },
                                {
                                    "name": "TYPE_FIXED32",
                                    "id": 7
                                },
                                {
                                    "name": "TYPE_BOOL",
                                    "id": 8
                                },
                                {
                                    "name": "TYPE_STRING",
                                    "id": 9
                                },
                                {
                                    "name": "TYPE_GROUP",
                                    "id": 10
                                },
                                {
                                    "name": "TYPE_MESSAGE",
                                    "id": 11
                                },
                                {
                                    "name": "TYPE_BYTES",
                                    "id": 12
                                },
                                {
                                    "name": "TYPE_UINT32",
                                    "id": 13
                                },
                                {
                                    "name": "TYPE_ENUM",
                                    "id": 14
                                },
                                {
                                    "name": "TYPE_SFIXED32",
                                    "id": 15
                                },
                                {
                                    "name": "TYPE_SFIXED64",
                                    "id": 16
                                },
                                {
                                    "name": "TYPE_SINT32",
                                    "id": 17
                                },
                                {
                                    "name": "TYPE_SINT64",
                                    "id": 18
                                }
                            ],
                            "options": {}
                        },
                        {
                            "name": "Label",
                            "values": [
                                {
                                    "name": "LABEL_OPTIONAL",
                                    "id": 1
                                },
                                {
                                    "name": "LABEL_REQUIRED",
                                    "id": 2
                                },
                                {
                                    "name": "LABEL_REPEATED",
                                    "id": 3
                                }
                            ],
                            "options": {}
                        }
                    ],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "EnumDescriptorProto",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "name",
                            "id": 1
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "EnumValueDescriptorProto",
                            "name": "value",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "EnumOptions",
                            "name": "options",
                            "id": 3
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "EnumValueDescriptorProto",
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
                            "type": "int32",
                            "name": "number",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "EnumValueOptions",
                            "name": "options",
                            "id": 3
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "ServiceDescriptorProto",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "name",
                            "id": 1
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "MethodDescriptorProto",
                            "name": "method",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "ServiceOptions",
                            "name": "options",
                            "id": 3
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "MethodDescriptorProto",
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
                            "name": "input_type",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "output_type",
                            "id": 3
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "MethodOptions",
                            "name": "options",
                            "id": 4
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "FileOptions",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "java_package",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "java_outer_classname",
                            "id": 8
                        },
                        {
                            "rule": "optional",
                            "options": {
                                "default": false
                            },
                            "type": "bool",
                            "name": "java_multiple_files",
                            "id": 10
                        },
                        {
                            "rule": "optional",
                            "options": {
                                "default": false
                            },
                            "type": "bool",
                            "name": "java_generate_equals_and_hash",
                            "id": 20
                        },
                        {
                            "rule": "optional",
                            "options": {
                                "default": "SPEED"
                            },
                            "type": "OptimizeMode",
                            "name": "optimize_for",
                            "id": 9
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "go_package",
                            "id": 11
                        },
                        {
                            "rule": "optional",
                            "options": {
                                "default": false
                            },
                            "type": "bool",
                            "name": "cc_generic_services",
                            "id": 16
                        },
                        {
                            "rule": "optional",
                            "options": {
                                "default": false
                            },
                            "type": "bool",
                            "name": "java_generic_services",
                            "id": 17
                        },
                        {
                            "rule": "optional",
                            "options": {
                                "default": false
                            },
                            "type": "bool",
                            "name": "py_generic_services",
                            "id": 18
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "UninterpretedOption",
                            "name": "uninterpreted_option",
                            "id": 999
                        }
                    ],
                    "enums": [
                        {
                            "name": "OptimizeMode",
                            "values": [
                                {
                                    "name": "SPEED",
                                    "id": 1
                                },
                                {
                                    "name": "CODE_SIZE",
                                    "id": 2
                                },
                                {
                                    "name": "LITE_RUNTIME",
                                    "id": 3
                                }
                            ],
                            "options": {}
                        }
                    ],
                    "messages": [],
                    "options": {},
                    "oneofs": {},
                    "extensions": [
                        1000,
                        536870911
                    ]
                },
                {
                    "name": "MessageOptions",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {
                                "default": false
                            },
                            "type": "bool",
                            "name": "message_set_wire_format",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {
                                "default": false
                            },
                            "type": "bool",
                            "name": "no_standard_descriptor_accessor",
                            "id": 2
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "UninterpretedOption",
                            "name": "uninterpreted_option",
                            "id": 999
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {},
                    "extensions": [
                        1000,
                        536870911
                    ]
                },
                {
                    "name": "FieldOptions",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {
                                "default": "STRING"
                            },
                            "type": "CType",
                            "name": "ctype",
                            "id": 1
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bool",
                            "name": "packed",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {
                                "default": false
                            },
                            "type": "bool",
                            "name": "lazy",
                            "id": 5
                        },
                        {
                            "rule": "optional",
                            "options": {
                                "default": false
                            },
                            "type": "bool",
                            "name": "deprecated",
                            "id": 3
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "experimental_map_key",
                            "id": 9
                        },
                        {
                            "rule": "optional",
                            "options": {
                                "default": false
                            },
                            "type": "bool",
                            "name": "weak",
                            "id": 10
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "UninterpretedOption",
                            "name": "uninterpreted_option",
                            "id": 999
                        }
                    ],
                    "enums": [
                        {
                            "name": "CType",
                            "values": [
                                {
                                    "name": "STRING",
                                    "id": 0
                                },
                                {
                                    "name": "CORD",
                                    "id": 1
                                },
                                {
                                    "name": "STRING_PIECE",
                                    "id": 2
                                }
                            ],
                            "options": {}
                        }
                    ],
                    "messages": [],
                    "options": {},
                    "oneofs": {},
                    "extensions": [
                        1000,
                        536870911
                    ]
                },
                {
                    "name": "EnumOptions",
                    "fields": [
                        {
                            "rule": "optional",
                            "options": {
                                "default": true
                            },
                            "type": "bool",
                            "name": "allow_alias",
                            "id": 2
                        },
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "UninterpretedOption",
                            "name": "uninterpreted_option",
                            "id": 999
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {},
                    "extensions": [
                        1000,
                        536870911
                    ]
                },
                {
                    "name": "EnumValueOptions",
                    "fields": [
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "UninterpretedOption",
                            "name": "uninterpreted_option",
                            "id": 999
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {},
                    "extensions": [
                        1000,
                        536870911
                    ]
                },
                {
                    "name": "ServiceOptions",
                    "fields": [
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "UninterpretedOption",
                            "name": "uninterpreted_option",
                            "id": 999
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {},
                    "extensions": [
                        1000,
                        536870911
                    ]
                },
                {
                    "name": "MethodOptions",
                    "fields": [
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "UninterpretedOption",
                            "name": "uninterpreted_option",
                            "id": 999
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {},
                    "oneofs": {},
                    "extensions": [
                        1000,
                        536870911
                    ]
                },
                {
                    "name": "UninterpretedOption",
                    "fields": [
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "NamePart",
                            "name": "name",
                            "id": 2
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "identifier_value",
                            "id": 3
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "uint64",
                            "name": "positive_int_value",
                            "id": 4
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "int64",
                            "name": "negative_int_value",
                            "id": 5
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "double",
                            "name": "double_value",
                            "id": 6
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "bytes",
                            "name": "string_value",
                            "id": 7
                        },
                        {
                            "rule": "optional",
                            "options": {},
                            "type": "string",
                            "name": "aggregate_value",
                            "id": 8
                        }
                    ],
                    "enums": [],
                    "messages": [
                        {
                            "name": "NamePart",
                            "fields": [
                                {
                                    "rule": "required",
                                    "options": {},
                                    "type": "string",
                                    "name": "name_part",
                                    "id": 1
                                },
                                {
                                    "rule": "required",
                                    "options": {},
                                    "type": "bool",
                                    "name": "is_extension",
                                    "id": 2
                                }
                            ],
                            "enums": [],
                            "messages": [],
                            "options": {},
                            "oneofs": {}
                        }
                    ],
                    "options": {},
                    "oneofs": {}
                },
                {
                    "name": "SourceCodeInfo",
                    "fields": [
                        {
                            "rule": "repeated",
                            "options": {},
                            "type": "Location",
                            "name": "location",
                            "id": 1
                        }
                    ],
                    "enums": [],
                    "messages": [
                        {
                            "name": "Location",
                            "fields": [
                                {
                                    "rule": "repeated",
                                    "options": {
                                        "packed": true
                                    },
                                    "type": "int32",
                                    "name": "path",
                                    "id": 1
                                },
                                {
                                    "rule": "repeated",
                                    "options": {
                                        "packed": true
                                    },
                                    "type": "int32",
                                    "name": "span",
                                    "id": 2
                                },
                                {
                                    "rule": "optional",
                                    "options": {},
                                    "type": "string",
                                    "name": "leading_comments",
                                    "id": 3
                                },
                                {
                                    "rule": "optional",
                                    "options": {},
                                    "type": "string",
                                    "name": "trailing_comments",
                                    "id": 4
                                }
                            ],
                            "enums": [],
                            "messages": [],
                            "options": {},
                            "oneofs": {}
                        }
                    ],
                    "options": {},
                    "oneofs": {}
                }
            ],
            "enums": [],
            "imports": [],
            "options": {
                "java_package": "com.google.protobuf",
                "java_outer_classname": "DescriptorProtos",
                "optimize_for": "SPEED"
            },
            "services": []
        }
    ],
    "options": {},
    "services": []
}).build();
