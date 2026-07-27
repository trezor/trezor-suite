import { type ReactNode } from 'react';

import { ContextMessage } from '@suite/message-system';
import { selectInvityServerEnvironment } from '@suite/settings';
import { TradingEnvironmentWarning } from '@suite/trading';
import { Context } from '@suite-common/message-system';
import { Box, Card, Column } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { ContentFlex } from 'src/support/suite/ContentFlex';
import { TradingFormOffer } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/TradingFormOffer';

import { ReceiveAddressModalControlsProvider } from '../TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

interface TradingFormLayoutProps {
    children: ReactNode;
}

export const TradingFormLayout = ({ children }: TradingFormLayoutProps) => {
    const invityServerEnvironment = useSelector(selectInvityServerEnvironment);

    return (
        <Column gap={16} data-testid="@trading/form">
            <TradingEnvironmentWarning tradingEnvironment={invityServerEnvironment} />

            {/* If clicking on disabled input, the click propagates to the form and submits it (some form values are then pushed to URL search params) */}
            <form onSubmit={e => e.preventDefault()}>
                <ReceiveAddressModalControlsProvider>
                    <ContentFlex gap={16} breakpoint={breakpoints.tablet} alignItems="stretch">
                        <Box flex="2" minWidth={0}>
                            {children}
                        </Box>
                        <Card flex="1">
                            <TradingFormOffer />
                        </Card>
                    </ContentFlex>
                </ReceiveAddressModalControlsProvider>
            </form>
            <ContextMessage context={Context.getLegal('gateway')} />
        </Column>
    );
};
