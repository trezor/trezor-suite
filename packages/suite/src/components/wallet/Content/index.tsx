import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { P, H4, Loader, colors, variables } from '@trezor/components';

// import FirmwareUpdate from 'views/Wallet/views/FirmwareUpdate';
import FirmwareUnsupported from './components/FirmwareUnsupported';

import l10nMessages from './index.messages';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 40px 35px 40px 35px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 20px 35px;
    }
`;

const Loading = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    flex-direction: column;
`;

const LoaderWrapper = styled.div`
    margin-right: 10px;
`;

interface TitleProps {
    type: string;
}

const Title = styled(H4)`
    font-size: ${variables.FONT_SIZE.BIGGER};
    font-weight: ${variables.FONT_WEIGHT.NORMAL};
    color: ${(props: TitleProps) => (props.type === 'progress' ? colors.TEXT_SECONDARY : '')};
    text-align: center;
    padding: 0;
`;

const Message = styled(P)`
    text-align: center;
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
`;

interface ExceptionPage {
    shortcut: string;
    message: string;
    title: string;
    type: string;
}

const getExceptionPage = (exceptionPage: ExceptionPage) => {
    const { title, message, shortcut } = exceptionPage;
    switch (exceptionPage.type) {
        case 'fwOutdated':
            return '<FirmwareUpdate />';
        case 'fwNotSupported':
            return (
                <FirmwareUnsupported title={title} message={message} networkShortcut={shortcut} />
            );
        default:
            return null;
    }
};

interface Props {
    className?: string;
    children?: ReactNode | ReactNode[];
    isLoading?: boolean;
    exceptionPage?: ExceptionPage;
    loader?: {
        type: string;
        title?: string;
        message?: string;
    };
}

const Content = ({ className, children, isLoading = false, loader, exceptionPage }: Props) => (
    <Wrapper className={className}>
        {!isLoading && children}
        {isLoading && exceptionPage && getExceptionPage(exceptionPage)}
        {isLoading && loader && (
            <Loading>
                <Row>
                    {loader.type === 'progress' && (
                        <LoaderWrapper>
                            <Loader size={30} />
                        </LoaderWrapper>
                    )}
                    <Title type={loader.type}>
                        {loader.title || (
                            <FormattedMessage {...l10nMessages.TR_INITIALIZING_ACCOUNTS} />
                        )}
                    </Title>
                </Row>
                {loader.message && <Message>{loader.message}</Message>}
            </Loading>
        )}
    </Wrapper>
);

export default Content;
