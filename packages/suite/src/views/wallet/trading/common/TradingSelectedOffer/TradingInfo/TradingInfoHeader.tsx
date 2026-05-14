import { type CryptoId } from 'invity-api';

import { Translation } from '@suite/intl';
import { parseCryptoId, useTradingUtils } from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';

interface TradingInfoHeaderProps {
    receiveCurrency: CryptoId;
}

export const TradingInfoHeader = ({ receiveCurrency }: TradingInfoHeaderProps) => {
    const { cryptoIdToPlatformName, cryptoIdToSymbolAndContractAddress } = useTradingUtils();

    const { networkId } = parseCryptoId(receiveCurrency);
    const platform = cryptoIdToPlatformName(networkId);

    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(receiveCurrency);
    const displaySymbol = coinSymbol ? getDisplaySymbol(coinSymbol, contractAddress) : '';

    return (
        <Row gap={spacings.xs}>
            {receiveCurrency && <TradingCoinLogo cryptoId={receiveCurrency} size={24} />}
            <Text typographyStyle="headline-sm">
                {coinSymbol && contractAddress ? (
                    <Translation
                        id="TR_TRADING_TOKEN_NETWORK"
                        values={{
                            tokenName: displaySymbol,
                            networkName: platform,
                        }}
                    />
                ) : (
                    displaySymbol
                )}
            </Text>
        </Row>
    );
};
