import { getRequest, postRequest } from './http';

const BASE_URL = 'https://submarine.corp.sldev.cz/api/v0';
const INVOICE_DETAILS_URL = `${BASE_URL}/invoice_details/bitcoin`;
const SWAP_URL = `${BASE_URL}/swaps`;

export const getInvoiceDetails = (invoice: string) => getRequest(`${INVOICE_DETAILS_URL}/${invoice}`);

export const requestSubmarineSwap = (invoice: string, refund: string, network = 'bitcoin') => {

    const payload = {
        invoice,
        network,
        refund,
    }

    return postRequest(SWAP_URL, payload);
}
