# 1.0.6
#### changes
- Fix for react-native workers
- Update outdated node_modules

# 1.0.5
#### changes
- Fixed Ripple-lib transaction event transformation (missing ledger_index field in transaction object)

# 1.0.4
#### changes
- Update dependencies (ripple-lib@1.4.0) and fix reconnection issue
- Update types for ERC20 tokens

# 1.0.3
#### changes
- Add currently connected url to 'getInfo' response
- Fixed getAccountInfo 'blockbook' type: empty = (transactions === 0 && unconfirmedTransactions === 0)

# 1.0.2
#### changes
- Fixed getTransaction response

# 1.0.1
#### changes
- Fixed amount calculation in blockbook Transactions

# 1.0.0-rc3
#### changes
- Added possibility to export workers as a main thread module (using webpack build)
- ./src/workers/common.ts changed to class for multiple instance usage

# 1.0.0-rc1
- First release