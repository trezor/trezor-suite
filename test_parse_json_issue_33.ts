// `sessionRequestThunk` catches the error:
// catch (error) {
//     await walletKit.respondSessionRequest({
//         topic: event.topic,
//         response: {
//             id: event.id,
//             jsonrpc: '2.0',
//             error: {
//                 code: 5000,
//                 message: error.message,
//             },
//         },
//     });
// }
// This correctly reports the error to the dApp.
// But why the "blank screen"?
// "When trying to sign the transaction below on Google Pixel 10 Pro XL, I get a blank screen with the top bar showing the hardware is connected but nothing actually happens"
// Does the Trezor Suite Native modal pop up but remains blank?
