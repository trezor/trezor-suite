/* @flow */

import React from 'react';
import styled from 'styled-components';
import { Button, Link, Icon, H5, icons, colors } from 'trezor-ui-components';
import LandingWrapper from 'views/Landing/components/LandingWrapper';

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const Import = () => (
    <LandingWrapper>
        <Wrapper>
            <Icon size={60} color={colors.WARNING_PRIMARY} icon={icons.WARNING} />
            <H5>Import tool is under construction</H5>
            <Link to="/">
                <Button>Take me back</Button>
            </Link>
        </Wrapper>
    </LandingWrapper>
);

export default Import;
