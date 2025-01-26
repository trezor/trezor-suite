import type { TradingPaymentMethodType } from '@suite-common/invity';
import { Flex, FlexProps, useMediaQuery, variables } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { CoinmarketPaymentType } from 'src/views/wallet/coinmarket/common/CoinmarketPaymentType';
import {
    CoinmarketProviderInfo,
    CoinmarketProviderInfoProps,
} from 'src/views/wallet/coinmarket/common/CoinmarketProviderInfo';

interface CoinmarketTransactionProvidersProps extends CoinmarketProviderInfoProps {
    paymentMethod?: TradingPaymentMethodType;
    paymentMethodName?: string;
}

export const CoinmarketTransactionProvider = ({
    exchange,
    providers,
    paymentMethod,
    paymentMethodName,
}: CoinmarketTransactionProvidersProps) => {
    const isBelowDesktop = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.XL})`);
    const flexProps: Omit<FlexProps, 'children'> = isBelowDesktop
        ? {
              direction: 'row',
              justifyContent: 'flex-start',
              height: 'auto',
              width: '100%',
          }
        : {
              direction: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              height: '100%',
          };

    return (
        <Flex gap={spacings.sm} {...flexProps}>
            <CoinmarketProviderInfo exchange={exchange} providers={providers} />
            {paymentMethod && (
                <CoinmarketPaymentType method={paymentMethod} methodName={paymentMethodName} />
            )}
        </Flex>
    );
};
