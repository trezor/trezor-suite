// The generic Trezor UI "connectPopup" handles `ethereumSignTypedData`.
// Wait, the error is inside the Connect Popup app!
// "blank screen with the top bar showing the hardware is connected but nothing actually happens"
// This matches the "Connect Popup"!
// When Trezor Connect opens its UI in an iframe (or React Native WebView/Popup), it crashes inside the Connect Popup!
// Why does it crash?
// Because `ethereumSignTypedData` parameter `data` is sent via IPC to the Connect logic.
// If the `Connect Popup` tries to parse or display the data, and it has `1.1579...e+77` (a float), it crashes?
// No, the float is valid JSON.
// BUT wait, look at `packages/connect/src/api/ethereum/api/ethereumSignTypedData.ts`:
// `message: JSON.stringify(this.params.data, null, 2)`
// Does it crash here?
// No.
