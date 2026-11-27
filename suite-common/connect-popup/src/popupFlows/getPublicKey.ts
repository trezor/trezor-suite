import { type BitcoinNetworkInfo } from '@trezor/connect';
import { validatePath } from '@trezor/connect-common/src/utils/pathUtils';
import { fromHardenedPathPart } from '@trezor/crypto-utils';

import { AddressConfirmationFlow } from './AddressConfirmationFlow';
import {
    describeCall,
    getBitcoinCoinInfos,
    getCoinPermissions,
    getEthereumCoinInfo,
    getRequests,
} from '../methodInfo';

type GetPublicKeyLabelParams = {
    path: number[];
    coinInfo?: BitcoinNetworkInfo;
    // Names a path of no bitcoin network.
    coinName: string;
};

export const getPublicKeyLabel = ({ path, coinInfo, coinName }: GetPublicKeyLabelParams) => {
    const coinLabel = coinInfo ? coinInfo.label : coinName;
    const hasSegwit = !!coinInfo?.segwit;
    const purpose = fromHardenedPathPart(path[0] ?? 0);
    let account = path.length >= 3 ? fromHardenedPathPart(path[2] ?? 0) : -1;
    let prefix = 'Export public key';
    let accountType = '';

    // Copay id
    if (purpose === 45342) {
        const copayPurpose = fromHardenedPathPart(path[1] ?? 0);
        account = fromHardenedPathPart(path[3] ?? 0);
        prefix = 'Export Copay ID';
        if (copayPurpose === 48) {
            accountType = 'multisig';
        } else if (copayPurpose === 44) {
            accountType = 'legacy';
        }
    } else if (purpose === 48) {
        accountType = `${coinLabel} multisig`;
    } else if (purpose === 44 && hasSegwit) {
        accountType = `${coinLabel} legacy`;
    } else if (purpose === 84 && hasSegwit) {
        accountType = `${coinLabel} native segwit`;
    } else {
        accountType = coinLabel;
    }

    if (account + 1 > 0) {
        return `${prefix} of ${accountType} account #${account + 1}`;
    }

    return prefix;
};

export class GetPublicKey extends AddressConfirmationFlow<'getPublicKey'> {
    protected getMethodInfo = async () => {
        const requests = getRequests(this.payload);
        // A path of no bitcoin network asks for a coin-less permission.
        const coinInfos = await getBitcoinCoinInfos(requests);
        const [request] = requests;
        const [coinInfo] = coinInfos;
        const info =
            requests.length > 1 || !request
                ? 'Export multiple public keys'
                : getPublicKeyLabel({
                      path: validatePath(request.path),
                      coinInfo,
                      coinName: coinInfo
                          ? ''
                          : ((await getEthereumCoinInfo(request.path))?.name ?? 'Unknown coin'),
                  });

        return describeCall(info, getCoinPermissions('read_xpub', coinInfos));
    };
}
