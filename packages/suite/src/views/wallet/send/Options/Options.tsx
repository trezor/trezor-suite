import { useSendFormContext } from 'src/hooks/wallet';

import { BitcoinOptions } from './BitcoinOptions/BitcoinOptions';
import { CardanoOptions } from './CardanoOptions';
import { EthereumOptions } from './EthereumOptions/EthereumOptions';
import { MiscNetworkOptions } from './MiscNetworkOptions/MiscNetworkOptions';
import { SolanaOptions } from './SolanaOptions/SolanaOptions';
import { TronOptions } from './TronOptions/TronOptions';

export const Options = () => {
    const {
        account: { networkType },
    } = useSendFormContext();

    return (
        <>
            {networkType === 'bitcoin' && <BitcoinOptions />}
            {networkType === 'ethereum' && <EthereumOptions />}
            {networkType === 'tron' && <TronOptions />}
            {(networkType === 'ripple' || networkType === 'stellar') && <MiscNetworkOptions />}
            {networkType === 'solana' && <SolanaOptions />}
            {networkType === 'cardano' && <CardanoOptions />}
        </>
    );
};
