// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/selectAccount.js

import {
    UI,
    createUiResponse,
    DiscoveryAccount,
    UiRequestSelectAccount,
    DiscoveryAccountType,
} from '@trezor/connect';
import { container, showView, postMessage } from './common';

const setHeader = (payload: UiRequestSelectAccount['payload']) => {
    const h3 = container.getElementsByTagName('h3')[0];
    if (payload.type === 'end') {
        h3.innerHTML = `Select ${payload.coinInfo.label} account`;
    } else {
        h3.innerHTML = `Loading ${payload.coinInfo.label} accounts...`;
    }
};

export const selectAccount = (payload: UiRequestSelectAccount['payload']) => {
    if (!payload) return;

    const { accountTypes, defaultAccountType, accounts } = payload;

    // first render
    // show "select-account" view
    // configure tabs
    if (Array.isArray(accountTypes)) {
        showView('select-account');
        // setHeader(payload);
        const selectAccountContainer = container.getElementsByClassName('select-account')[0];

        if (accountTypes.length > 1) {
            const tabs = container.getElementsByClassName('tabs')[0] as HTMLButtonElement;
            tabs.style.display = 'flex';
            const buttons = tabs.getElementsByClassName(
                'tab-selection',
            ) as HTMLCollectionOf<HTMLButtonElement>;
            const firstGroupHeader = tabs.children[0].innerHTML; // store default label (Accounts)
            const selectedType =
                defaultAccountType || (accountTypes.includes('p2sh') ? 'p2sh' : 'p2wpkh');
            selectAccountContainer.className = `select-account ${selectedType}`;
            if (accountTypes.includes('p2sh')) {
                const bech32warn = container.getElementsByClassName('bech32-warning')[0];
                bech32warn.removeAttribute('style'); // remove default 'display: none' from element
            }
            for (let i = 0; i < buttons.length; i++) {
                const button = buttons[i];
                const type = button.getAttribute('data-tab');
                if (type && accountTypes.indexOf(type as DiscoveryAccountType) >= 0) {
                    button.onclick = () => {
                        selectAccountContainer.className = `select-account ${type}`;
                    };
                } else {
                    tabs.removeChild(button);
                    i--;
                }
            }
            tabs.children[0].innerHTML = firstGroupHeader; // switch first label to default
        } else if (accountTypes.length === 1) {
            selectAccountContainer.className = `select-account ${accountTypes[0]}`;
        } else {
            console.error('should never happen');
        }
    }

    // set header
    setHeader(payload);
    if (!accounts) return;

    const buttons = {
        p2wpkh: container.querySelectorAll('.select-account-list.p2wpkh')[0],
        p2tr: container.querySelectorAll('.select-account-list.p2tr')[0],
        p2sh: container.querySelectorAll('.select-account-list.p2sh')[0],
        p2pkh: container.querySelectorAll('.select-account-list.p2pkh')[0],
    };

    const handleClick = (event: Event) => {
        if (!(event.currentTarget instanceof HTMLElement)) return;
        const index = event.currentTarget.getAttribute('data-index');
        postMessage(createUiResponse(UI.RECEIVE_ACCOUNT, parseInt(index as string, 10)));
        showView('loader');
    };

    const removeEmptyButton = (buttonContainer: Element) => {
        const defaultButton = buttonContainer.querySelectorAll('.account-default')[0];
        if (defaultButton) {
            buttonContainer.removeChild(defaultButton);
        }
    };

    const updateButtonValue = (button: Element, account: DiscoveryAccount) => {
        if (button.innerHTML.length < 1) {
            button.innerHTML = `
                <span class="account-title"></span>
                <span class="account-status"></span>`;
        }
        const title = button.getElementsByClassName('account-title')[0];
        const status = button.getElementsByClassName('account-status')[0];
        title.innerHTML = account.label;

        if (typeof account.balance !== 'string') {
            status.innerHTML = 'Loading...';
            button.setAttribute('disabled', 'disabled');
        } else {
            status.innerHTML = account.empty ? 'New account' : account.balance;
            const buttonDisabled = payload.preventEmpty && account.empty;
            if (buttonDisabled) {
                button.setAttribute('disabled', 'disabled');
            } else {
                button.removeAttribute('disabled');
                button.addEventListener('click', handleClick, false);
            }
        }
    };

    accounts.forEach((account, index) => {
        const buttonContainer = buttons[account.type];
        const existed = buttonContainer.querySelectorAll(`[data-index="${index}"]`)[0];
        if (!existed) {
            const button = document.createElement('button');
            button.className = 'list';
            button.setAttribute('data-index', index.toString());

            updateButtonValue(button, account);
            removeEmptyButton(buttonContainer);
            buttonContainer.appendChild(button);
        } else {
            updateButtonValue(existed, account);
        }
    });
};
