// `chainId = Number(typedPayload.data.domain.chainId) || 1;`
// Wait. What if `typedPayload.data.domain` doesn't exist?
// It always exists based on `EIP712Domain`.
// BUT, the crash could be right here or somewhere inside `useTxSimulationPopupCall`.
// The user has a "Google Pixel 10 Pro XL". So they are using the Trezor Suite app for Android.
// In Android, there is an issue where `Number(typedPayload.data.domain.chainId)` could be `NaN`?
// No, `"1"` becomes `1`.
// What if `JSON.parse` parsing `115792089237316195423570985008687907853269984665640564039457584007913129639935` to `1.157920892373162e+77` throws an error inside `ethereumSignTypedData.run()`
// and because it throws synchronously inside the Promise executor, it returns an error `response.success = false`?
// Let's test what happens when we use `ethers.js` or `BigNumber` on the exact payload, OR if the issue is really just `json-bigint` for CoW Swap!
// Wait! If CoW Swap passes `11579...` WITH QUOTES, then `JSON.parse` works fine, so what is the issue?
