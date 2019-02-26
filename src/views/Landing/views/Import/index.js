/* @flow */

import React from 'react';
import styled from 'styled-components';

import colors from 'config/colors';
import icons from 'config/icons';

import { H2 } from 'components/Heading';
import Icon from 'components/Icon';
import Link from 'components/Link';
import Button from 'components/Button';
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
            <Icon
                size={60}
                color={colors.WARNING_PRIMARY}
                icon={icons.WARNING}
            />
            <H2>Import tool is under construction</H2>
            <Link to="/">
                <Button>Take me back</Button>
            </Link>
        </Wrapper>
    </LandingWrapper>
);

export default Import;