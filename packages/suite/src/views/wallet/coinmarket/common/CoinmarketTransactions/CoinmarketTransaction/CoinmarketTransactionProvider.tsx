import { variables } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { CoinmarketPaymentMethodType } from 'src/types/coinmarket/coinmarket';
import { CoinmarketPaymentType } from 'src/views/wallet/coinmarket/common/CoinmarketPaymentType';
import {
    CoinmarketProviderInfo,
    CoinmarketProviderInfoProps,
} from 'src/views/wallet/coinmarket/common/CoinmarketProviderInfo';
import styled from 'styled-components';

const CoinmarketTransactionProvidersWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: ${spacingsPx.sm};
    height: 100%;

    ${variables.SCREEN_QUERY.BELOW_DESKTOP} {
        flex-direction: row;
        justify-content: flex-start;
        width: 100%;
        height: auto;
    }
`;

interface CoinmarketTransactionProvidersProps extends CoinmarketProviderInfoProps {
    paymentMethod?: CoinmarketPaymentMethodType;
    paymentMethodName?: string;
}

export const CoinmarketTransactionProvider = ({
    exchange,
    providers,
    paymentMethod,
    paymentMethodName,
}: CoinmarketTransactionProvidersProps) => (
    <CoinmarketTransactionProvidersWrapper>
        <CoinmarketProviderInfo exchange={exchange} providers={providers} />
        {paymentMethod && (
            <CoinmarketPaymentType method={paymentMethod} methodName={paymentMethodName} />
        )}
    </CoinmarketTransactionProvidersWrapper>
);
