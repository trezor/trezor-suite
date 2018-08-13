import React from 'react';
import styled from 'styled-components';
import { H2 } from '~/js/components/common/Heading';
import Icon from '~/js/components/common/Icon';
import colors from '~/js/config/colors';
import ICONS from '~/js/constants/icons';
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

export const DeviceSettings = () => (
    <Section>
        <Row>
            <Icon
                color={colors.WARNING_PRIMARY}
                icon={ICONS.WARNING}
            />
            <StyledH2>Device settings is under construction</StyledH2>
            <P>Please use Bitcoin wallet interface to change your device settings</P>
            <a className="button" href="https://wallet.trezor.io/">Take me to the Bitcoin wallet</a>
        </Row>
    </Section>
);

export default connect(null, null)(DeviceSettings);
