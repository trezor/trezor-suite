// Message called from popup.html inline script before "window.onload" event. This is first message from popup to window.opener.
export const BOOTSTRAP = 'popup-bootstrap';
// Message from popup.js to window.opener, called after "window.onload" event. This is second message from popup to window.opener.
export const LOADED = 'popup-loaded';
// Message from window.opener to popup.js. Send settings to popup. This is first message from window.opener to popup.
export const INIT = 'popup-init';
// Error message from popup to window.opener. Could be thrown during popup initialization process (POPUP.INIT)
export const ERROR = 'popup-error';
// Message to webextensions, opens "trezor-usb-permission.html" within webextension
export const EXTENSION_USB_PERMISSIONS = 'open-usb-permissions';
// Message called from both [popup > iframe] then [iframe > popup] in this exact order.
// Firstly popup call iframe to resolve popup promise in Core
// Then iframe reacts to POPUP.HANDSHAKE message and sends ConnectSettings, transport information and requested method details back to popup
export const HANDSHAKE = 'popup-handshake';
// Event emitted from PopupManager at the end of popup closing process.
// Sent from popup thru window.opener to an iframe because message channel between popup and iframe is no longer available
export const CLOSED = 'popup-closed';
// Message called from iframe to popup, it means that popup will not be needed (example: Blockchain methods are not using popup at all)
// This will close active popup window and/or clear opening process in PopupManager (maybe popup wasn't opened yet)
export const CANCEL_POPUP_REQUEST = 'ui-cancel-popup-request';
// Message called from inline element in popup.html (window.closeWindow), this is used only with webextensions to properly handle popup close event
export const CLOSE_WINDOW = 'window.close';
