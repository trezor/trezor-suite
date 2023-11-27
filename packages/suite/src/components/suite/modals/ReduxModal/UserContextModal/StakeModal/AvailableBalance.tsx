import React from 'react';
import styled from 'styled-components';
import { H3, P, variables } from '@trezor/components';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Translation, FormattedCryptoAmount, FiatValue } from 'src/components/suite';

const Title = styled(H3)`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const GreyP = styled(P)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

interface AvailableBalanceProps {
    formattedBalance: string;
    symbol: NetworkSymbol;
}

export const AvailableBalance = ({ formattedBalance, symbol }: AvailableBalanceProps) => (
    <div>
        <Title>
            <Translation id="AMOUNT" />
        </Title>

        <GreyP size="small" weight="medium">
            <Translation id="TR_STAKE_AVAILABLE" />{' '}
            <FormattedCryptoAmount value={formattedBalance} symbol={symbol} />{' '}
            <FiatValue amount={formattedBalance} symbol={symbol} showApproximationIndicator>
                {({ value }) => (value ? <span>{value}</span> : null)}
            </FiatValue>
        </GreyP>
    </div>
);
