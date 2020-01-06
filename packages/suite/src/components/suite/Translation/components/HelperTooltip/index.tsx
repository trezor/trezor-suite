import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { AppState, Dispatch } from '@suite-types';
import { Tooltip } from '@trezor/components';
import { Link } from '@trezor/components-v2';

const StyledLink = styled(Link)`
    font-size: 10px;

    &:hover {
        text-decoration: underline;
    }
`;

const MessageWrapper = styled.span`
    text-decoration: underline solid red;
`;

const mapStateToProps = (state: AppState) => ({
    translationMode: state.suite.debug.translationMode,
    language: state.suite.language,
});

const mapDispatchToProps = (_dispatch: Dispatch) => ({});

interface OwnProps {
    messageId?: string;
    children: any;
}

type Props = OwnProps & ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

/**
 * When translationMode is enabled wraps a message with a Tooltip and adds styling to provide visual hint for translators
 */
const HelperTooltip = (props: Props) => {
    return props.translationMode ? (
        <Tooltip
            placement="bottom"
            content={
                <StyledLink
                    variant="nostyle"
                    href={`https://crowdin.com/translate/trezor-suite/99/en-${props.language}#q=${props.messageId}`}
                >
                    {props.messageId}
                </StyledLink>
            }
        >
            <MessageWrapper>{props.children}</MessageWrapper>
        </Tooltip>
    ) : (
        props.children
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(HelperTooltip);
