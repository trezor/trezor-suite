import React from 'react';
import styled from 'styled-components';
import { ReactSVG } from 'react-svg';
import { Translation } from '@suite-components';
import { withInvityLayout } from '@suite/components/wallet';
import { useSavingsKYCFailed } from '@suite/hooks/wallet/coinmarket/savings/useSavingsKYCFailed';
import { Button, Link } from '@trezor/components';
import { resolveStaticPath } from '@suite-utils/build';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    align-content: stretch;
`;

const Circle = styled.div`
    width: 64px;
    height: 64px;
    background: #f9eeee;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 70px 0;
`;

const Header = styled.div`
    font-size: 24px;
    line-height: 24px;
    margin-bottom: 13px;
`;

const Description = styled.div`
    font-size: 14px;
    line-height: 28px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-bottom: 24px;
`;

const KYCFailed = () => {
    const { supportUrl } = useSavingsKYCFailed();

    return (
        <Wrapper>
            <Circle>
                <ReactSVG
                    src={resolveStaticPath('images/svg/warning.svg')}
                    beforeInjection={svg => {
                        svg.setAttribute('width', '24px');
                        svg.setAttribute('height', '24px');
                    }}
                    loading={() => <span className="loading" />}
                />
            </Circle>
            <Header>
                <Translation id="TR_SAVINGS_KYC_FAILED_HEADER" />
            </Header>
            <Description>
                <Translation id="TR_SAVINGS_KYC_FAILED_DESCRIPTION" />
            </Description>
            <Link variant="nostyle" href={supportUrl}>
                <Button>
                    <Translation id="TR_SAVINGS_KYC_FAILED_GO_TO_PARTNER_BUTTON" />
                </Button>
            </Link>
        </Wrapper>
    );
};
export default withInvityLayout(KYCFailed, {
    showStepsGuide: true,
});
