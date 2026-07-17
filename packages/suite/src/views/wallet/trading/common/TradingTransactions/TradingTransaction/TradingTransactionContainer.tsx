import { type JSX } from 'react';

import { Card, Column, Row } from '@trezor/components';

import { useLayoutSize } from 'src/hooks/suite';

interface TradingTransactionContainerProps {
    TradeDetail: JSX.Element;
    TradeProviders: JSX.Element;
    TradeButton: JSX.Element;
    'data-testid'?: string;
}

export const TradingTransactionContainer = ({
    TradeDetail,
    TradeProviders,
    TradeButton,
    'data-testid': dataTestId,
}: TradingTransactionContainerProps) => {
    const { isBelowDesktop, isBelowMobile } = useLayoutSize();

    return (
        <Card type="sunken" margin={{ bottom: 20 }} data-testid={dataTestId}>
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
                                  top: 8,
                                  bottom: 8,
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
