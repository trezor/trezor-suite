// `const parsedData = typeof data === 'string' ? JSON.parse(data) : data;`
// That is a classic WalletConnect bug in many dApps!
// CoW Swap might be sending the object directly instead of stringifying it.
// If so, `JSON.parse("[object Object]")` throws `SyntaxError`.
// Let's verify if `trezorConnectPopupActions.connectPopupCallThunk` or the wallet connect middleware catches it.
