/* @flow */
import React from 'react';
import styled from 'styled-components';
import { H4, Icon, Button, P, Link, colors, icons as ICONS } from 'trezor-ui-components';
import { getOldWalletUrl } from 'utils/url';
import Content from 'views/Wallet/components/Content';
import { connect } from 'react-redux';

import type { TrezorDevice } from 'flowtype';

type Props = {
    device: ?TrezorDevice,
};

const Section = styled.section`
    display: flex;
    flex-direction: column;
`;

const Row = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 50px 0;
`;

const StyledP = styled(P)`
    padding: 0 0 15px 0;
    text-align: center;
`;

const StyledHeading = styled(H4)`
    text-align: center;
`;

const DeviceSettings = (props: Props) => (
    <Content>
        <Section>
            <Row>
                <Icon size={60} color={colors.WARNING_PRIMARY} icon={ICONS.WARNING} />
                <StyledHeading>Device settings is under construction</StyledHeading>
                <StyledP>
                    Please use Bitcoin wallet interface to change your device settings
                </StyledP>
                <Link href={getOldWalletUrl(props.device)} target="_self">
                    <Button>Take me to the Bitcoin wallet</Button>
                </Link>
            </Row>
        </Section>
    </Content>
);

export default connect(
    null,
    null
)(DeviceSettings);
