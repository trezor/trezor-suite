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