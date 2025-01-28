import {
    GetMyInputsFromTransactionParams,
    getMyInputsFromTransaction,
} from '../getMyInputsFromTransaction';

describe(getMyInputsFromTransaction.name, () => {
    it("filters out utxo that doesn't belong to the account", () => {
        const account: GetMyInputsFromTransactionParams['account'] = {
            addresses: {
                change: [
                    {
                        address: 'account-address-A',
                        path: '',
                        transfers: 0,
                        balance: '',
                        sent: '',
                        received: '',
                    },
                    {
                        address: 'account-address-B',
                        path: '',
                        transfers: 0,
                        balance: '',
                        sent: '',
                        received: '',
                    },
                ],
                unused: [],
                used: [],
            },
        };

        const tx: GetMyInputsFromTransactionParams['tx'] = {
            details: {
                vin: [
                    {
                        addresses: ['account-address-A', 'someone-else-address'],
                        isAddress: true,
                        n: 0,
                    },
                ],
                vout: [],
                size: 0,
                totalInput: '',
                totalOutput: '',
            },
        };

        const result = getMyInputsFromTransaction({ tx, account }).map(utxo => utxo.address);
        expect(result).toEqual(['account-address-A']);
    });
});
