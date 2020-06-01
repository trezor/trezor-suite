import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { AppState, Dispatch } from '@suite-types';
import { Tooltip, Link } from '@trezor/components';

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
    translationMode: state.suite.settings.debug.translationMode,
    language: state.suite.settings.language,
});

const mapDispatchToProps = (_dispatch: Dispatch) => ({});

interface OwnProps {
    messageId?: string;
    isNested?: boolean;
    children: any;
}

type Props = OwnProps & ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

/**
 * When translationMode is enabled wraps a message with a Tooltip and adds styling to provide visual hint for translators
 */
const HelperTooltip = (props: Props) => {
    // don't wrap with tooltip for messages that are nested in another message
    // fixes https://github.com/trezor/trezor-suite/issues/1509
    return props.translationMode && !props.isNested ? (
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
