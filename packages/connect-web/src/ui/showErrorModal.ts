const LAYER_ID = 'TrezorConnectInteractionLayer';
const STORAGE_KEY = 'TrezorConnect_DismissedErrors';

const INLINE_STYLES =
    '.trezorconnect-container{position:fixed!important;display:-webkit-box!important;display:-webkit-flex!important;display:-ms-flexbox!important;display:flex!important;-webkit-box-orient:vertical!important;-webkit-box-direction:normal!important;-webkit-flex-direction:column!important;-ms-flex-direction:column!important;flex-direction:column!important;-webkit-box-align:center!important;-webkit-align-items:center!important;-ms-flex-align:center!important;align-items:center!important;z-index:10000!important;width:100%!important;height:100%!important;top:0!important;left:0!important;background:rgba(0,0,0,.5)!important;overflow:auto!important;padding:20px!important;margin:0!important;backdrop-filter:blur(4px)!important}.trezorconnect-container .trezorconnect-window{position:relative!important;display:block!important;width:420px!important;max-width:calc(100vw - 40px)!important;font-family:"TT Satoshi",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif!important;margin:auto!important;border-radius:12px!important;background:#FFFFFF!important;text-align:center!important;overflow:hidden!important;box-shadow:0 8px 32px rgba(0,0,0,0.12)!important}.trezorconnect-container .trezorconnect-window .trezorconnect-head{text-align:left;padding:20px 24px!important;display:-webkit-box!important;display:-webkit-flex!important;display:-ms-flexbox!important;display:flex!important;-webkit-box-align:center!important;-webkit-align-items:center!important;-ms-flex-align:center!important;align-items:center!important;border-bottom:1px solid #E6E8EC!important}.trezorconnect-container .trezorconnect-window .trezorconnect-head .trezorconnect-logo{-webkit-box-flex:1;-webkit-flex:1;-ms-flex:1;flex:1}.trezorconnect-container .trezorconnect-window .trezorconnect-head .trezorconnect-close{cursor:pointer!important;width:32px!important;height:32px!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:8px!important;transition:background-color 0.2s ease!important}.trezorconnect-container .trezorconnect-window .trezorconnect-head .trezorconnect-close svg{fill:#59626D;-webkit-transition:fill .2s ease!important;transition:fill .2s ease!important}.trezorconnect-container .trezorconnect-window .trezorconnect-head .trezorconnect-close:hover{background-color:#F3F5F8!important}.trezorconnect-container .trezorconnect-window .trezorconnect-head .trezorconnect-close:hover svg{fill:#2D343D}.trezorconnect-container .trezorconnect-window .trezorconnect-body{padding:32px 24px!important;background:#FFFFFF!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body h3{color:#2D343D!important;font-size:20px!important;font-weight:500!important;line-height:28px!important;margin:0 0 8px 0!important;letter-spacing:-0.2px!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body p{margin:0 0 24px 0!important;font-weight:400!important;color:#59626D!important;font-size:14px!important;line-height:22px!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body .trezorconnect-checkbox-wrapper{display:flex!important;align-items:center!important;justify-content:flex-start!important;margin:0 0 20px 0!important;text-align:left!important;cursor:pointer!important;user-select:none!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body .trezorconnect-checkbox-wrapper input[type="checkbox"]{width:18px!important;height:18px!important;margin:0 8px 0 0!important;cursor:pointer!important;accent-color:#136334!important;flex-shrink:0!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body .trezorconnect-checkbox-wrapper label{font-size:14px!important;color:#59626D!important;cursor:pointer!important;line-height:22px!important;font-weight:400!important;margin:0!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body button{width:100%!important;padding:12px 16px!important;margin:0!important;border-radius:8px!important;font-size:16px!important;font-weight:500!important;cursor:pointer!important;background:#136334!important;color:#FFFFFF!important;border:0!important;min-height:48px!important;-webkit-transition:background-color .2s ease!important;transition:background-color .2s ease!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body button:hover{background-color:#0F4D29!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body button:active{background-color:#0F4D29!important;transform:translateY(1px)!important}';

const HTML = `
    <style>${INLINE_STYLES}</style>
    <div class="trezorconnect-container" id="${LAYER_ID}">
        <div class="trezorconnect-window">
            <div class="trezorconnect-head">
                <svg class="trezorconnect-logo" x="0px" y="0px" viewBox="0 0 163.7 41.9" width="78px" height="20px" preserveAspectRatio="xMinYMin meet">
                    <polygon points="101.1,12.8 118.2,12.8 118.2,17.3 108.9,29.9 118.2,29.9 118.2,35.2 101.1,35.2 101.1,30.7 110.4,18.1 101.1,18.1"/>
                    <path d="M158.8,26.9c2.1-0.8,4.3-2.9,4.3-6.6c0-4.5-3.1-7.4-7.7-7.4h-10.5v22.3h5.8v-7.5h2.2l4.1,7.5h6.7L158.8,26.9z M154.7,22.5 h-4V18h4c1.5,0,2.5,0.9,2.5,2.2C157.2,21.6,156.2,22.5,154.7,22.5z"/>
                    <path d="M130.8,12.5c-6.8,0-11.6,4.9-11.6,11.5s4.9,11.5,11.6,11.5s11.7-4.9,11.7-11.5S137.6,12.5,130.8,12.5z M130.8,30.3 c-3.4,0-5.7-2.6-5.7-6.3c0-3.8,2.3-6.3,5.7-6.3c3.4,0,5.8,2.6,5.8,6.3C136.6,27.7,134.2,30.3,130.8,30.3z"/>
                    <polygon points="82.1,12.8 98.3,12.8 98.3,18 87.9,18 87.9,21.3 98,21.3 98,26.4 87.9,26.4 87.9,30 98.3,30 98.3,35.2 82.1,35.2 "/>
                    <path d="M24.6,9.7C24.6,4.4,20,0,14.4,0S4.2,4.4,4.2,9.7v3.1H0v22.3h0l14.4,6.7l14.4-6.7h0V12.9h-4.2V9.7z M9.4,9.7 c0-2.5,2.2-4.5,5-4.5s5,2,5,4.5v3.1H9.4V9.7z M23,31.5l-8.6,4l-8.6-4V18.1H23V31.5z"/>
                    <path d="M79.4,20.3c0-4.5-3.1-7.4-7.7-7.4H61.2v22.3H67v-7.5h2.2l4.1,7.5H80l-4.9-8.3C77.2,26.1,79.4,24,79.4,20.3z M71,22.5h-4V18 h4c1.5,0,2.5,0.9,2.5,2.2C73.5,21.6,72.5,22.5,71,22.5z"/>
                    <polygon points="40.5,12.8 58.6,12.8 58.6,18.1 52.4,18.1 52.4,35.2 46.6,35.2 46.6,18.1 40.5,18.1 "/>
                </svg>
                <div class="trezorconnect-close">
                    <svg x="0px" y="0px" viewBox="24 24 60 60" width="24px" height="24px" preserveAspectRatio="xMinYMin meet">
                        <polygon class="st0" points="40,67.9 42.1,70 55,57.1 67.9,70 70,67.9 57.1,55 70,42.1 67.9,40 55,52.9 42.1,40 40,42.1 52.9,55 "/>
                    </svg>
                </div>
            </div>
            <div class="trezorconnect-body">
            </div>
        </div>
    </div>
`;

// Helper to create a hash from error text for storage key
const hashErrorText = (text: string): string => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
};

// Check if error has been dismissed
const isErrorDismissed = (errorText: string): boolean => {
    try {
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (!dismissed) return false;
        const dismissedErrors = JSON.parse(dismissed) as Record<string, boolean>;
        return dismissedErrors[hashErrorText(errorText)] === true;
    } catch {
        return false;
    }
};

// Save dismissed error to localStorage
const dismissError = (errorText: string): void => {
    try {
        const dismissed = localStorage.getItem(STORAGE_KEY);
        const dismissedErrors = dismissed ? (JSON.parse(dismissed) as Record<string, boolean>) : {};
        dismissedErrors[hashErrorText(errorText)] = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissedErrors));
    } catch {
        // Silently fail if localStorage is not available
    }
};

export const showErrorModal = (
    open: () => void,
    cancel: () => void,
    errorText: string,
    debug: boolean,
) => {
    if (document.getElementById(LAYER_ID)) {
        return;
    }

    // Check if user has dismissed this error before
    if (isErrorDismissed(errorText)) {
        open();
        return;
    }

    // Create host element for shadow DOM
    const host = document.createElement('div');
    host.id = LAYER_ID;

    // Attach shadow DOM
    const shadowRoot = host.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = HTML;

    if (document.body) {
        document.body.appendChild(host);
    }

    const body = shadowRoot.querySelector('.trezorconnect-body') as HTMLDivElement;

    body.innerHTML = `
        <p>${errorText}</p>
        <div class="trezorconnect-checkbox-wrapper">
            <input type="checkbox" id="trezorconnect-dismiss-checkbox" />
            <label for="trezorconnect-dismiss-checkbox">Don't show this again</label>
        </div>
        <button class="trezorconnect-open">Continue</button>
        `;

    const checkbox = shadowRoot.querySelector(
        '#trezorconnect-dismiss-checkbox',
    ) as HTMLInputElement;

    const button = shadowRoot.querySelector('.trezorconnect-open') as HTMLButtonElement;
    button.onclick = () => {
        if (checkbox.checked) {
            // todo: do we want to show error again always copy changes? if not, we need to assign some unique id per error
            dismissError(errorText);
        }
        open();
        if (document.body) {
            document.body.removeChild(host);
        }
    };

    const close = shadowRoot.querySelector('.trezorconnect-close') as HTMLDivElement;
    close.onclick = () => {
        cancel();
        if (document.body) {
            document.body.removeChild(host);
        }
    };

    // if debug is true, we also print info about this window for 3rd party developers, mainly so that they know they may disable this modal by setting uiEnabled to false
    if (debug) {
        const debugInfo = document.createElement('div');
        debugInfo.style.textAlign = 'left';
        debugInfo.style.fontSize = '10px';
        debugInfo.style.marginTop = '20px';
        debugInfo.style.borderRadius = '3px';
        debugInfo.style.color = 'red';
        debugInfo.textContent =
            'TrezorConnect Debug Info:\nThis modal can be disabled by setting TrezorConnect.init({ uiEnabled: false }) in your application code.';
        body.appendChild(debugInfo);
    }
};
