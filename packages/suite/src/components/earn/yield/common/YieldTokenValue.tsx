import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Row, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

type YieldTokenValueToken = {
    symbol: string;
    networkSymbol: NetworkSymbol;
    contractAddress: string | null;
};

type YieldTokenValueProps = {
    token: YieldTokenValueToken;
    amount: string;
    'data-testid'?: string;
};

export const YieldTokenValue = ({
    token,
    amount,
    'data-testid': dataTestId,
}: YieldTokenValueProps) => (
    <Row alignItems="center" gap={8}>
        <TokenIcon
            size={24}
            symbol={token.networkSymbol}
            contractAddress={token.contractAddress}
            placeholder={token.symbol}
            showNetworkIcon
            isBordered={false}
        />
        <Text typographyStyle="body-md-strong">
            {/*
                `isBalance` runs the amount through `formatCoinBalance`, which keeps the leading
                significant digits and appends an ellipsis (…) once the fractional part gets too
                long. This keeps the rendered width bounded (no more layout jitter) while still
                showing the meaningful digits of small stablecoin/WETH amounts — a fixed decimal
                cap instead rounded those down to zeroes.
            */}
            <FormattedCryptoAmount
                value={amount}
                symbol={token.symbol}
                isBalance
                data-testid={dataTestId}
            />
        </Text>
    </Row>
);
