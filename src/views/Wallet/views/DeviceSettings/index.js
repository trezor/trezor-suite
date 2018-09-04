import React from 'react';
import styled from 'styled-components';
import { H2 } from 'components/Heading';
import Icon from 'components/Icon';
import colors from 'config/colors';
import Button from 'components/Button';
import ICONS from 'config/icons';
import { connect } from 'react-redux';

const Section = styled.section`
`;

const P = styled.p`
    padding: 12px 0px 24px 0px;
    text-align: center;
`;

const StyledH2 = styled(H2)`
    padding-top: 15px;
`;

const Row = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 0px 48px;
    padding-bottom: 98px;
`;

const DeviceSettings = () => (
    <Section>
        <Row>
            <Icon
                size={60}
                color={colors.WARNING_PRIMARY}
                icon={ICONS.WARNING}
            />
            <StyledH2>Device settings is under construction</StyledH2>
            <P>Please use Bitcoin wallet interface to change your device settings</P>
            <a href="https://wallet.trezor.io/">
                <Button>Take me to the Bitcoin wallet</Button>
            </a>
        </Row>
    </Section>
);

export default connect(null, null)(DeviceSettings);
