# @trezor/protocol

Library for decoding and encoding messages from/to Trezor

## protocol-bridge

Message format:

```
| 2 bytes               |                          |
| protobuf_message_type | protobuf_message_payload |
```

## protocol-v1

Message format:

```
| 3 bytes               | 2 bytes   | 2 bytes               | `len` - 2 bytes          |
| magic | magic | magic | len | len | protobuf_message_type | protobuf_message_payload |
```

Continuation packet format (chunks):

```
| 1 byte |                        |
| magic  | protobuf_message_chunk |
```

## protocol-v2 (TrezorHostProtocol)

Message format:

```
| 1 byte        | 2 bytes           | 2 bytes   | `len` including 4 bytes crc   |
| control_byte  | channel | channel | len | len | thp_payload + crc             |
```

Continuation packet format (chunks):

```
| 1 byte               | 2 bytes           |               |
| continuation_packet  | channel | channel | payload_chunk |
```

## protocol-trzd

Decode loaded `@trezor/protobuf` messages
