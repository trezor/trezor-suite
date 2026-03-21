// Wait, the "blank screen" appears when WalletConnect receives the prompt.
// When WalletConnect receives `eth_signTypedData_v4` in `suite-common/walletconnect/src/adapters/ethereum.ts`:
// It parses the data using `JSON.parse(data)`, then calls `trezorConnectPopupActions.connectPopupCallThunk`.
// What if `data` IS NOT a string?
// `const [address, data] = event.params.request.params;`
// In the wallet connect V2 protocol, `data` is sometimes already an object!
// If `data` is ALREADY an object, `JSON.parse(data)` will fail with `SyntaxError: Unexpected token o in JSON at position 1` (because `"[object Object]"`) !!
// AND IT THROWS!
// And the Thunk throws!
// The error is not handled, so the popup never opens, but the app says "hardware connected" because that's the generic top bar? No.
