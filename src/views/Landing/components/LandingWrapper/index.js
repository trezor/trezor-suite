/* @flow */
import * as React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Header from 'components/Header';
import Footer from 'components/Footer';
import Log from 'components/Log';
import Loader from 'components/Loader';
import ContextNotifications from 'components/notifications/Context';
import colors from 'config/colors';

import InitializationError from '../InitializationError';

type Props = {
    loading?: boolean;
    error?: ?string;
    children?: React.Node;
}

const Wrapper = styled.div`
    min-height: 100%;
    min-width: 720px;

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
                <Header />
                <ContextNotifications />
                {props.error && <InitializationError error={props.error} />}
                <Log />
                {!props.error && (
                    <LandingContent>
                        { props.children }
                    </LandingContent>
                )}
                <Footer isLanding />
            </React.Fragment>
        )}
    </Wrapper>
);

LandingWrapper.propTypes = {
    loading: PropTypes.bool,
    error: PropTypes.string,
    children: PropTypes.node,
};

LandingWrapper.defaultProps = {
    loading: false,
    error: null,
};

export default LandingWrapper;