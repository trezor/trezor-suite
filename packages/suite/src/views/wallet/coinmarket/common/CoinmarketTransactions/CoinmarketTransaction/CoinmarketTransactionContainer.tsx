import { Card, Column, Row, useMediaQuery, variables } from '@trezor/components';
import { spacings } from '@trezor/theme';

interface CoinmarketTransactionContainerProps {
    TradeDetail: JSX.Element;
    TradeProviders: JSX.Element;
    TradeButton: JSX.Element;
}

export const CoinmarketTransactionContainer = ({
    TradeDetail,
    TradeProviders,
    TradeButton,
}: CoinmarketTransactionContainerProps) => {
    const isBelowDesktop = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.XL})`);
    const isMobile = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.SM})`);

    return (
        <Card fillType="none">
            <Row flexWrap={isBelowDesktop ? 'wrap' : undefined}>
                <Column
                    alignItems="flex-start"
                    flex="auto"
                    width={isBelowDesktop ? 'calc(100% - 180px)' : '100%'}
                >
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
                    order={isMobile ? 2 : undefined}
                    width={isMobile ? '100%' : 180}
                >
                    {TradeButton}
                </Column>
            </Row>
        </Card>
    );
};
