export const onClear = () => {
    const responses = document.getElementsByClassName('response');
    while (responses.length) {
        const r = responses[0];
        if (r.parentElement) r.parentElement.removeChild(r);
    }
};

export const getInputValue = (id: string): string => {
    const input = document.getElementById(id) as HTMLInputElement;

    return input.value;
};

export const setInputValue = (id: string, value: string): void => {
    const input = document.getElementById(id) as HTMLInputElement;
    input.value = value;
};

export const fillValues = (data: any) => {
    setInputValue('get-account-info-address', data.address);
    setInputValue('get-account-info-options', JSON.stringify(data.accountInfoOptions, null, 2));
    setInputValue('get-account-utxo-address', data.address);
    setInputValue('estimate-fee-options', JSON.stringify(data.estimateFeeOptions, null, 2));
    setInputValue('get-tx-id', data.txid);
    setInputValue('push-transaction-tx', data.tx);
    setInputValue('blockhash-number', data.blockNumber);
    setInputValue('subscribe-addresses', data.subscribe);
};
