import styled from 'styled-components';
import React from 'react';
import { connect } from 'react-redux';

import colors from 'config/colors';
import icons from 'config/icons';

import Content from 'views/Wallet/components/Content';
import { H2 } from 'components/Heading';
import Icon from 'components/Icon';
import Link from 'components/Link';
import Button from 'components/Button';

const Section = styled.section`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
`;

const Row = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const WalletSettings = () => (
    <Content>
        <Section>
            <Row>
                <Icon
                    size={60}
                    color={colors.WARNING_PRIMARY}
                    icon={icons.WARNING}
                />
                <H2>Wallet settings is under construction</H2>
                <Link to="/">
                    <Button>Take me back</Button>
                </Link>
            </Row>
        </Section>
    </Content>
);

export default connect(null, null)(WalletSettings);
