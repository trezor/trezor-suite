import * as React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
// import Footer from 'components/Footer';
// import Log from 'components/Log';
// import ContextNotifications from 'components/notifications/Context';
import { colors, Loader, Header } from '@trezor/components';

import InitializationError from '../Error';

interface Props {
    loading?: boolean;
    error?: string;
}

const Wrapper = styled.div`
    min-height: 100vh;

    display: flex;
    flex-direction: column;
    align-items: center;

    text-align: center;
    background: ${colors.LANDING};
`;

const LandingContent = styled.div`
    flex: 1;
    display: flex;
    justify-content: center;
`;

const LandingLoader = styled(Loader)`
    margin: auto;
`;

const LandingWrapper = (props: Props) => (
    <Wrapper>
        {props.loading && <LandingLoader text="Loading" size={100} />}
        {!props.loading && (
            <React.Fragment>
                {/* <ContextNotifications /> */}
                {props.error && <InitializationError error={props.error} />}
                {/* <Log /> */}
                {!props.error && <LandingContent>{props.children}</LandingContent>}
                {/* <Footer isLanding /> */}
            </React.Fragment>
        )}
    </Wrapper>
);

LandingWrapper.defaultProps = {
    loading: false,
    error: null,
};

export default LandingWrapper;
