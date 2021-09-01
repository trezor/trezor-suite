import React from 'react';
import styled from 'styled-components';
import { Icon, Button } from '@trezor/components';
import { Translation } from '@suite-components';
import { isDesktop } from '@suite-utils/env';
import { useCoinmarketSpendContext } from '@wallet-hooks/useCoinmarketSpend';
import { NoProviders, Wrapper } from '@wallet-views/coinmarket';
import { CoinmarketSkeleton } from '@wallet-views/coinmarket/skeleton';

const Vouchers = styled.div`
    width: 100%;
`;

const ProviderInfo = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const StyledIcon = styled(Icon)`
    padding-right: 4px;
`;

const IframeWrapper = styled.div`
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid ${props => props.theme.STROKE_GREY};
`;

const WebContent = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 150px;
`;

const IframeContent = styled.div``;

const WebInfo = styled.div`
    display: flex;
    justify-content: center;
`;

const StyledButton = styled(Button)`
    margin-top: 25px;
`;

const Left = styled.div`
    padding-right: 5px;
    display: flex;
`;

const Right = styled.div``;

const CoinmarketSpend = () => {
    const { isLoading, noProviders, voucherSiteUrl, openWindow, setShowLeaveModal } =
        useCoinmarketSpendContext();
    const showIframe = !isDesktop();

    return (
        <Wrapper responsiveSize="LG">
            {isLoading && <CoinmarketSkeleton />}
            {!isLoading && noProviders && (
                <NoProviders>
                    <Translation id="TR_SPEND_NO_PROVIDERS" />
                </NoProviders>
            )}
            {!isLoading && !noProviders && (
                <Vouchers>
                    {showIframe && (
                        <IframeContent>
                            <ProviderInfo>
                                <Left>
                                    <StyledIcon icon="INFO" />
                                </Left>
                                <Right>
                                    <Translation id="TR_SPEND_PROVIDER_CONTENT" />
                                </Right>
                            </ProviderInfo>
                            <IframeWrapper>
                                <iframe
                                    title="."
                                    sandbox="allow-scripts allow-forms allow-same-origin"
                                    style={{
                                        width: '100%',
                                        height: '650px',
                                        border: '0',
                                        display: 'block',
                                    }}
                                    src={voucherSiteUrl}
                                />
                            </IframeWrapper>
                        </IframeContent>
                    )}
                    {!showIframe && (
                        <WebContent>
                            <WebInfo>
                                <Left>
                                    <StyledIcon icon="INFO" />
                                </Left>
                                <Right>
                                    <Translation id="TR_SPEND_PROVIDER_CONTENT_WINDOW" />
                                </Right>
                            </WebInfo>
                            <StyledButton
                                variant="primary"
                                onClick={() => {
                                    setShowLeaveModal(true);
                                    openWindow(voucherSiteUrl);
                                }}
                            >
                                <Translation id="TR_SPEND_OPEN_WINDOW" />
                            </StyledButton>
                        </WebContent>
                    )}
                </Vouchers>
            )}
        </Wrapper>
    );
};

export default CoinmarketSpend;
