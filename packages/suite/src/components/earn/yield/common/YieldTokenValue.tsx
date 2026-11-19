import { AssetIcon } from '@suite/assets';
import type { YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { Row, Text } from '@trezor/components';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';

type YieldTokenValueProps = {
    token: YieldFlowDisplayToken;
    amount: string;
    'data-testid'?: string;
};

export const YieldTokenValue = ({
    token,
    amount,
    'data-testid': dataTestId,
}: YieldTokenValueProps) => (
    <Row alignItems="center" gap={8}>
        <AssetIcon
            size={24}
            networkSymbol={token.networkSymbol}
            contractAddress={token.contractAddress}
            showNetworkIcon
            isBordered={false}
        />
        <Text typographyStyle="body-md-strong">
            <FormattedCryptoAmount
                value={amount}
                networkSymbol={token.networkSymbol}
                contractAddress={token.contractAddress}
                data-testid={dataTestId}
            />
        </Text>
    </Row>
);
