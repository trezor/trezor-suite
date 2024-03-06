import styled from 'styled-components';

import { P2pFormContext, useCoinmarketP2pForm } from 'src/hooks/wallet/useCoinmarketP2pForm';
import { withSelectedAccountLoaded, WithSelectedAccountLoadedProps } from 'src/components/wallet';
import { Wrapper } from 'src/views/wallet/coinmarket';
import { CoinmarketLayout } from 'src/views/wallet/coinmarket/common';
import { Inputs } from './Inputs';
import { P2pInfo } from './P2pInfo';
import { Footer } from './Footer';

const Form = styled.form`
    width: 100%;
`;

const CoinmarketP2p = (props: WithSelectedAccountLoadedProps) => {
    const coinmarketP2pContextValues = useCoinmarketP2pForm(props);
    const {
        isDraft,
        formState: { isDirty },
        handleClearFormButtonClick,
        handleSubmit,
        onSubmit,
    } = coinmarketP2pContextValues;

    return (
        <CoinmarketLayout
            selectedAccount={props.selectedAccount}
            onClearFormButtonClick={isDirty || isDraft ? handleClearFormButtonClick : undefined}
        >
            <P2pFormContext.Provider value={coinmarketP2pContextValues}>
                <Wrapper $responsiveSize="LG">
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <Inputs />
                        <P2pInfo />
                        <Footer />
                    </Form>
                </Wrapper>
            </P2pFormContext.Provider>
        </CoinmarketLayout>
    );
};

export default withSelectedAccountLoaded(CoinmarketP2p, {
    title: 'TR_NAV_P2P',
});
