import type { TradingPaymentMethodType } from '@suite-common/trading';
import { Flex, FlexProps, useMediaQuery, variables } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { TradingPaymentType } from 'src/views/wallet/trading/common/TradingPaymentType';
import {
    TradingProviderInfo,
    TradingProviderInfoProps,
} from 'src/views/wallet/trading/common/TradingProviderInfo';

interface TradingTransactionProvidersProps extends TradingProviderInfoProps {
    paymentMethod?: TradingPaymentMethodType;
    paymentMethodName?: string;
}

export const TradingTransactionProvider = ({
    exchange,
    providers,
    paymentMethod,
    paymentMethodName,
}: TradingTransactionProvidersProps) => {
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
            <TradingProviderInfo exchange={exchange} providers={providers} />
            {paymentMethod && (
                <TradingPaymentType method={paymentMethod} methodName={paymentMethodName} />
            )}
        </Flex>
    );
};
