import { CryptoId } from 'invity-api';

import { Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { getDisplaySymbol } from '@suite-common/wallet-config';

import { Translation } from 'src/components/suite';
import { useTradingInfo } from 'src/hooks/wallet/trading/useTradingInfo';
import { parseCryptoId } from 'src/utils/wallet/trading/tradingUtils';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';

interface TradingInfoHeaderProps {
    receiveCurrency?: CryptoId;
}

export const TradingInfoHeader = ({ receiveCurrency }: TradingInfoHeaderProps) => {
    const { cryptoIdToPlatformName, cryptoIdToSymbolAndContractAddress } = useTradingInfo();

    const { networkId } = parseCryptoId(receiveCurrency!);
    const platform = cryptoIdToPlatformName(networkId);

    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(receiveCurrency);
    const displaySymbol = coinSymbol ? getDisplaySymbol(coinSymbol, contractAddress) : '';

    return (
        <Row gap={spacings.xs}>
            {receiveCurrency && <TradingCoinLogo cryptoId={receiveCurrency} size={24} />}
            <Text typographyStyle="titleSmall">
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
