// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/selectFee.js

import {
    BitcoinNetworkInfo,
    SelectFeeLevel,
    UI,
    UiRequestSelectFee,
    UpdateCustomFee,
    createUiResponse,
} from '@trezor/connect';
import { formatAmount, formatTime } from '@trezor/connect/src/utils/formatUtils';

import { container, postMessage, showView } from './common';

const fees: SelectFeeLevel[] = [];
// reference to currently selected button
let selectedFee: HTMLElement | undefined | null;

/*
 * Update custom fee view.
 */
export const updateCustomFee = (payload: UpdateCustomFee['payload']) => {
    const custom = container.getElementsByClassName('custom-fee')[0];
    const opener = container.getElementsByClassName('opener')[0];
    const customFeeLabel = opener.getElementsByClassName('fee-info')[0];

    if (custom.className.indexOf('active') < 0) {
        return;
    }

    // replace values
    fees.splice(0, fees.length);
    // add new fees from message
    fees.push(...payload.feeLevels);

    const customFee = fees.find(f => f.name === 'custom');
    if (customFee) {
        if (customFee.fee === '0') {
            customFeeLabel.textContent = 'Insufficient funds';
        } else {
            const feeAmount = document.createElement('span');
            feeAmount.className = 'fee-amount';
            feeAmount.textContent = formatAmount(customFee.fee, payload.coinInfo);

            const feeTime = document.createElement('span');
            feeTime.className = 'fee-time';
            // @ts-expect-error unrecognized union member.
            feeTime.textContent = formatTime(customFee.minutes);

            customFeeLabel.replaceChildren(feeAmount, feeTime);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    validation(payload.coinInfo);
};

const validation = (coinInfo: BitcoinNetworkInfo) => {
    const sendButton = container.getElementsByClassName('send-button')[0] as HTMLButtonElement;
    if (!selectedFee) {
        sendButton.setAttribute('disabled', 'disabled');
        sendButton.textContent = 'Send';

        return;
    }
    const selectedName = selectedFee.getAttribute('data-fee') || 'custom';
    const selectedValue = fees.find(f => f.name === selectedName);

    if (selectedValue && selectedValue.fee !== '0') {
        sendButton.removeAttribute('disabled');
        // @ts-expect-error unrecognized union member.
        sendButton.textContent = `Send ${formatAmount(selectedValue.total, coinInfo)}`;
    } else {
        sendButton.setAttribute('disabled', 'disabled');
        sendButton.textContent = 'Send';
    }
};

/*
 * Show select fee view.
 */
export const selectFee = (data: UiRequestSelectFee['payload']) => {
    if (!data || !Array.isArray(data.feeLevels)) return; // TODO: back to accounts?

    showView('select-fee');

    // remove old references
    selectedFee = null;
    fees.splice(0, fees.length);
    // add new fees from message
    fees.push(...data.feeLevels);

    const feeList = container.getElementsByClassName('select-fee-list')[0];
    const customFeeElement = feeList.cloneNode(true);

    const feeButtons = fees
        // ignore custom
        .filter(level => level.name !== 'custom')
        .map(level => {
            const button = document.createElement('button');
            button.classList.add('list');

            if (level.fee !== '0') {
                button.dataset.fee = level.name;

                const feeTitle = document.createElement('span');
                feeTitle.classList.add('fee-title');

                if (level.name === 'normal') {
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = level.name;
                    feeTitle.appendChild(nameSpan);

                    const subtitleSpan = document.createElement('span');
                    subtitleSpan.classList.add('fee-subtitle');
                    subtitleSpan.textContent = 'recommended';
                    feeTitle.appendChild(subtitleSpan);
                } else {
                    feeTitle.textContent = level.name;
                }

                const feeInfo = document.createElement('span');
                feeInfo.classList.add('fee-info');

                const feeAmount = document.createElement('span');
                feeAmount.classList.add('fee-amount');
                feeAmount.textContent = formatAmount(level.fee, data.coinInfo);
                feeInfo.appendChild(feeAmount);

                const feeTime = document.createElement('span');
                feeTime.classList.add('fee-time');
                if ('minutes' in level) feeTime.textContent = formatTime(level.minutes);
                feeInfo.appendChild(feeTime);

                button.appendChild(feeTitle);
                button.appendChild(feeInfo);
            } else {
                // For disabled button (insufficient funds)
                button.disabled = true;

                const feeTitle = document.createElement('span');
                feeTitle.classList.add('fee-title');
                feeTitle.textContent = level.name;
                button.appendChild(feeTitle);

                const feeInfo = document.createElement('span');
                feeInfo.classList.add('fee-info');
                feeInfo.textContent = 'Insufficient funds';
                button.appendChild(feeInfo);
            }

            return button;
        });
    // append custom fee button
    feeList.replaceChildren(...feeButtons, customFeeElement);

    // references to html elements
    const sendButton = container.getElementsByClassName('send-button')[0] as HTMLButtonElement;
    const opener = container.getElementsByClassName('opener')[0] as HTMLButtonElement;
    const customFeeLabel = opener.getElementsByClassName('fee-info')[0];

    const onFeeSelect = (event: Event) => {
        if (event.currentTarget instanceof HTMLElement) {
            if (selectedFee) {
                selectedFee.classList.remove('active');
            }
            selectedFee = event.currentTarget;
            selectedFee.classList.add('active');

            validation(data.coinInfo);
        }
    };

    // find all buttons which has composed transaction and add click event listener to it
    for (let i = 0; i < feeButtons.length; i++) {
        feeButtons[i]?.addEventListener('click', onFeeSelect);
    }

    // custom fee button logic
    let composingTimeout = 0;
    opener.onclick = () => {
        if (opener.className.indexOf('active') >= 0) return;

        if (selectedFee) {
            selectedFee.classList.remove('active');
        }

        const composedCustomFee = fees.find(f => f.name === 'custom');
        let customFeeDefaultValue: string | undefined = '0';
        if (!composedCustomFee) {
            if (selectedFee) {
                const selectedName = selectedFee.getAttribute('data-fee');
                const selectedValue = fees.find(f => f.name === selectedName);
                if (selectedValue && selectedValue.fee !== '0') {
                    customFeeDefaultValue = selectedValue.feePerByte;
                }
            }
            if (customFeeDefaultValue === '0') {
                customFeeDefaultValue = '1'; // TODO: get normal
            }
        } else if (composedCustomFee.fee !== '0') {
            customFeeDefaultValue = composedCustomFee.feePerByte;
        }

        opener.classList.add('active');
        selectedFee = opener;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        focusInput(customFeeDefaultValue);
    };

    const focusInput = (defaultValue?: string) => {
        const input = container.getElementsByTagName('input')[0];
        setTimeout(() => {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            input.oninput = handleCustomFeeChange;
            if (defaultValue) {
                input.value = defaultValue.toString();
                const event = document.createEvent('Event');
                event.initEvent('input', true, true);
                input.dispatchEvent(event);
            }
            input.focus();
        }, 1);
    };

    const minFee = data.coinInfo.minFeeSatoshiKb / 1000;
    const maxFee = data.coinInfo.maxFeeSatoshiKb / 1000;

    const handleCustomFeeChange = (event: Event) => {
        window.clearTimeout(composingTimeout);

        sendButton.setAttribute('disabled', 'disabled');
        // @ts-expect-error value not found on Event HTMLInputElement.oninput fn
        const { value } = event.currentTarget;
        const valueNum = parseFloat(value);

        if (Number.isNaN(valueNum)) {
            if (value.length > 0) {
                customFeeLabel.textContent = 'Incorrect fee';
            } else {
                customFeeLabel.textContent = 'Missing fee';
            }
        } else if (valueNum < minFee) {
            customFeeLabel.textContent = 'Fee is too low';
        } else if (valueNum > maxFee) {
            customFeeLabel.textContent = 'Fee is too big';
        } else {
            customFeeLabel.textContent = 'Composing...';

            const composeCustomFeeTimeoutHandler = () => {
                postMessage(
                    createUiResponse(UI.RECEIVE_FEE, {
                        type: 'compose-custom',
                        value,
                    }),
                );
            };

            composingTimeout = window.setTimeout(composeCustomFeeTimeoutHandler, 800);
        }
    };

    const changeAccountButton = container.getElementsByClassName(
        'back-button',
    )[0] as HTMLButtonElement;
    changeAccountButton.onclick = () => {
        postMessage(
            createUiResponse(UI.RECEIVE_FEE, {
                type: 'change-account',
            }),
        );
        showView('loader');
    };

    sendButton.onclick = () => {
        if (!selectedFee) return;
        const selectedName = selectedFee.getAttribute('data-fee');
        postMessage(
            createUiResponse(UI.RECEIVE_FEE, {
                type: 'send',
                value: selectedName || 'custom',
            }),
        );
        showView('loader');
    };

    // select default fee level
    const defaultLevel = feeList.querySelectorAll<HTMLButtonElement>('[data-fee="normal"]')[0];
    if (defaultLevel) {
        defaultLevel.click();
    } else {
        // normal level not available, try to select first active button or custom fee
        const allLevels = feeList.querySelectorAll<HTMLElement>('.list');
        for (let i = 0; i < allLevels.length; i++) {
            if (!allLevels[i].hasAttribute('disabled')) {
                allLevels[i].click();
                break;
            }
        }
    }
};
