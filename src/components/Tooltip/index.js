import React from 'react';
import { FormattedMessage } from 'react-intl';
import RcTooltip from 'rc-tooltip';
import colors from 'config/colors';
import Link from 'components/Link';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import l10nCommonMessages from 'views/common.messages';

const Wrapper = styled.div``;

const Content = styled.div`
    max-width: ${props => `${props.maxWidth}px` || 'auto'};
`;

const ContentWrapper = styled.div`
    display: block;
`;

const ReadMore = styled.div`
    margin-top: 15px;
    padding: 10px 0 5px 0;
    text-align: center;
    width: 100%;
    color: ${colors.WHITE};
    border-top: 1px solid ${colors.TEXT_SECONDARY};
`;

const Tooltip = ({
    maxWidth,
    className,
    placement,
    content,
    readMoreLink,
    children,
    enterDelayMs,
}) => (
    <Wrapper className={className}>
        <RcTooltip
            arrowContent={<div className="rc-tooltip-arrow-inner" />}
            placement={placement}
            mouseEnterDelay={enterDelayMs || 0}
            overlay={() => (
                <ContentWrapper>
                    <Content maxWidth={maxWidth}>{content}</Content>
                    {readMoreLink && (
                        <Link href={readMoreLink}>
                            <ReadMore><FormattedMessage {...l10nCommonMessages.TR_LEARN_MORE} /></ReadMore>
                        </Link>
                    )
                    }
                </ContentWrapper>
            )}
        >
            {children}
        </RcTooltip>
    </Wrapper>
);

Tooltip.propTypes = {
    className: PropTypes.string,
    placement: PropTypes.string,
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.string,
    ]),
    maxWidth: PropTypes.number,
    content: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.string,
    ]),
    readMoreLink: PropTypes.string,
    enterDelayMs: PropTypes.number,
};

export default Tooltip;
