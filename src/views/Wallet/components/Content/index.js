/* @flow */

import * as React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Loader from 'components/Loader';
import { FONT_SIZE } from 'config/variables';
import colors from 'config/colors';

import type { State } from 'flowtype';

import FirmwareOutdated from './components/FirmwareOutdated';
import FirmwareUnsupported from './components/FirmwareUnsupported';

type Props = {
    children?: React.Node,
    isLoading?: boolean,
    loader?: $ElementType<$ElementType<State, 'selectedAccount'>, 'loader'>,
    exceptionPage?: $ElementType<$ElementType<State, 'selectedAccount'>, 'exceptionPage'>,
}

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 40px 35px 40px 35px;
`;

const Loading = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    flex-direction: column;
`;

const Text = styled.div`
    font-size: ${FONT_SIZE.BIGGER};
    color: ${colors.TEXT_SECONDARY};
    margin-left: 10px;
`;

const Message = styled.div`
    font-size: ${FONT_SIZE.BASE};
    color: ${colors.TEXT_PRIMARY};
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
`;

const getExceptionPage = (exceptionPage) => {
    const { title, message, shortcut } = exceptionPage;
    switch (exceptionPage.type) {
        case 'fwOutdated':
            return <FirmwareOutdated title={title} message={message} networkShortcut={shortcut} />;
        case 'fwNotSupported':
            return <FirmwareUnsupported title={title} message={message} networkShortcut={shortcut} />;
        default: return null;
    }
};

const Content = ({
    children,
    isLoading = false,
    loader,
    exceptionPage,
}: Props) => (
    <Wrapper>
        {(!isLoading) && children}
        {isLoading && exceptionPage && getExceptionPage(exceptionPage)}
        {isLoading && loader && (
            <Loading>
                <Row>
                    {loader.type === 'progress' && <Loader size={30} />}
                    <Text>{loader.title || 'Initializing accounts'}</Text>
                </Row>
                {loader.message && <Message>{loader.message}</Message>}
            </Loading>
        )}
    </Wrapper>
);

Content.propTypes = {
    children: PropTypes.oneOfType([PropTypes.element, PropTypes.array]),
    isLoading: PropTypes.bool,
    loader: PropTypes.object,
    exceptionPage: PropTypes.object,
};

export default Content;
