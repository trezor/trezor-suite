import { PaymentMethodType } from '@suite/trading';
import type { TradingPaymentMethodType, TradingUtilsProvidersProps } from '@suite-common/trading';
import { Flex, type FlexProps } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useLayoutSize } from 'src/hooks/suite';

import { TradingUtilsProvider } from '../../TradingUtils/TradingUtilsProvider';

interface TradingTransactionProvidersProps {
    exchange?: string;
    providers?: TradingUtilsProvidersProps;
    paymentMethod?: TradingPaymentMethodType;
    paymentMethodName?: string;
}

export const TradingTransactionProvider = ({
    exchange,
    providers,
    paymentMethod,
    paymentMethodName,
}: TradingTransactionProvidersProps) => {
    const { isBelowDesktop } = useLayoutSize();
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
            <TradingUtilsProvider exchange={exchange} providers={providers} />
            {paymentMethod && (
                <PaymentMethodType method={paymentMethod} methodName={paymentMethodName} />
            )}
        </Flex>
    );
};
