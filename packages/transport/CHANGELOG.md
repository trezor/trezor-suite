# 1.1.12

-   ci: install out of monorepo scripts (ef97f86)

# 1.1.11

-   819c019d1 chore: use workspace:\* everywhere

# 1.1.10

-   fix(transport): update encoded_network to ArrayBuffer
-   chore(transport): protobuf patch for ethereum get address

# 1.1.9

chore(transport): update protobufs, update dependencies

# 1.1.8

-   chore(connect;transport): connect.init add transports param; rename transports

# 1.1.7

-   Code cleanup, sharing constants with @trezor/connect

# 1.1.6

-   Dependencies: typescript 4.9

# 1.1.5

-   Removed flowtype generation
-   Added CoinJoinRequest message
-   Cardano: Added support for [CIP36](https://cips.cardano.org/cips/cip36/) Catalyst registration format

# 1.1.4

-   Added cardano types related to [babbage feature](https://github.com/trezor/trezor-suite/commit/efe9c78a2f74a1b7653b3fddf6cca35ba38d3ae9#diff-c1b9d6a93a3b65c45c4dcf06aa86d6c7a84bcc2e14fefdc4a9bdc3d3298c9a5a)

# 1.1.2

-   Added CardanoTxRequiredSigner.key_path': 'optional in protobuf patches

# 1.1.1

-   Changed latest bridge url to https://connect.trezor.io/8/data/bridge/latest.txt'
-   Added trezor-common submodule. Protobuf definitions (messages.json) and protobuf related typescript definitions.

# 1.1.0

-   Added @trezor/utils dependency.

# 1.0.1

-   Fixed: encoding protobuf messages containing numbers over Number.MAX_SAFE_INTEGER in browser environment.

# 1.0.0

-   first release
