# @trezor/protobuf

Library for decoding and encoding messages from/to Trezor

## protocol-bridge

Message format:

```
| 2 bytes             |                        |
| ProtobufMessageType | protobufMessagePayload |
```

## protocol-v1

First packet format:

```
| 3 bytes               | 2 bytes   | 2 bytes             | `len` - 2 bytes        |
| magic | magic | magic | len | len | protobufMessageType | protobufMessagePayload |
```

Continuation packet format (chunks):

```
| magic | protobufMessageChunk |
```

## protocol-v2 (TrezorHostProtocol)

TODO: link to specification
https://www.notion.so/satoshilabs/THP-Specification-d17010749c254977889660ec158e675c

Message format:

```
| 1 byte | 2 bytes           | 2 bytes   | `len` bytes       |
| magic  | channel | channel | len | len | thpMessagePayload |
```

Continuation packet format (chunks):

```
| 1 byte | 2 bytes           |                        |
| magic  | channel | channel | thpMessagePayloadChunk |
```

## protocol-trzd

decode dynamically loaded `@trezor/protobuf` messages
