import { getFiatCurrencyFlag } from '@suite-common/flags';
import { cryptoIdToNetworkSymbolAndContractAddress, useTradingUtils } from '@suite-common/trading';
import { Flag, Row } from '@trezor/components';
import { selectShouldShowNetworkIcon } from '@trezor/product-components';
import { exhaustive } from '@trezor/type-utils';

import { FormattedCryptoAmount, HiddenPlaceholder } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';

import { type TradingTransactionSide } from './tradingTransactionItemUtils';

type TradingTransactionSideAmountProps = {
    side: TradingTransactionSide;
    'data-testid'?: string;
};

export const TradingTransactionSideAmount = ({
    side,
    'data-testid': dataTestId,
}: TradingTransactionSideAmountProps) => {
    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();

    const cryptoId = side.type === 'crypto' ? side.cryptoId : undefined;
    const { coinSymbol, contractAddress } = cryptoId
        ? cryptoIdToSymbolAndContractAddress(cryptoId)
        : { coinSymbol: undefined, contractAddress: undefined };
    const { symbol: networkSymbol } = cryptoIdToNetworkSymbolAndContractAddress(cryptoId);
    const showNetworkIcon = useSelector(state =>
        selectShouldShowNetworkIcon(state, networkSymbol, contractAddress),
    );

    switch (side.type) {
        case 'crypto': {
            return (
                <Row gap={8}>
                    <TradingCoinLogo
                        cryptoId={side.cryptoId}
                        size={32}
                        showNetworkIcon={showNetworkIcon}
                    />
                    <FormattedCryptoAmount
                        value={side.amount}
                        symbol={coinSymbol}
                        contractAddress={contractAddress}
                        data-testid={dataTestId}
                        isCompact
                    />
                </Row>
            );
        }
        case 'fiat': {
            const flag = getFiatCurrencyFlag(side.fiatCurrency);

            return (
                <Row gap={8}>
                    {flag && <Flag country={flag} size={32} />}
                    <HiddenPlaceholder data-testid={dataTestId}>
                        {side.amount} {side.fiatCurrency}
                    </HiddenPlaceholder>
                </Row>
            );
        }
        default:
            return exhaustive(side);
    }
};
