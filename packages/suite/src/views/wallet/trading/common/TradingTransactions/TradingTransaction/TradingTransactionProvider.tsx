import type { TradingPaymentMethodType } from '@suite-common/trading';
import type { FlexProps } from '@trezor/components';
import { Flex } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useLayoutSize } from 'src/hooks/suite';
import { TradingPaymentType } from 'src/views/wallet/trading/common/TradingPaymentType';
import type { TradingProviderInfoProps } from 'src/views/wallet/trading/common/TradingProviderInfo';
import { TradingProviderInfo } from 'src/views/wallet/trading/common/TradingProviderInfo';

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
            <TradingProviderInfo exchange={exchange} providers={providers} />
            {paymentMethod && (
                <TradingPaymentType method={paymentMethod} methodName={paymentMethodName} />
            )}
        </Flex>
    );
};
