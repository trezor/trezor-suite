interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
    chrome?: any; // Only in Chromium browsers

    // Needed for Cypress
    Cypress?: any;
    TrezorConnect?: any;
    store?: any;
}
