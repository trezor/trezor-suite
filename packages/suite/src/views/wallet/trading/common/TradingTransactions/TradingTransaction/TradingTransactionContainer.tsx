import { Card, Column, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useLayoutSize } from 'src/hooks/suite';

interface TradingTransactionContainerProps {
    TradeDetail: JSX.Element;
    TradeProviders: JSX.Element;
    TradeButton: JSX.Element;
}

export const TradingTransactionContainer = ({
    TradeDetail,
    TradeProviders,
    TradeButton,
}: TradingTransactionContainerProps) => {
    const { isBelowDesktop, isBelowMobile } = useLayoutSize();

    return (
        <Card fillType="flat" margin={{ bottom: spacings.lg }}>
            <Row flexWrap={isBelowDesktop ? 'wrap' : undefined}>
                <Column flex="auto" width={isBelowDesktop ? 'calc(100% - 180px)' : '100%'}>
                    {TradeDetail}
                </Column>
                <Column
                    flex="none"
                    alignItems="start"
                    width={isBelowDesktop ? '100%' : 200}
                    order={isBelowDesktop ? 1 : undefined}
                    margin={
                        isBelowDesktop
                            ? {
                                  top: spacings.xs,
                                  bottom: spacings.xs,
                              }
                            : undefined
                    }
                >
                    {TradeProviders}
                </Column>
                <Column
                    alignItems="flex-end"
                    justifyContent="center"
                    flex="none"
                    order={isBelowMobile ? 2 : undefined}
                    width={isBelowMobile ? '100%' : 180}
                >
                    {TradeButton}
                </Column>
            </Row>
        </Card>
    );
};
