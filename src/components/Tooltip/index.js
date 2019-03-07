import Link from 'components/Link';
import PropTypes from 'prop-types';
import RcTooltip from 'rc-tooltip';
import React from 'react';
import colors from 'config/colors';
import styled from 'styled-components';
import tooltipStyles from './styles/Tooltip';

const Wrapper = styled.div`
    ${tooltipStyles};
`;

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

class Tooltip extends React.Component {
    constructor(props) {
        super(props);
        this.wrapper = null;
    }

    render() {
        const { maxWidth, className, placement, content, readMoreLink, children } = this.props;
        const Overlay = (
            <ContentWrapper>
                <Content maxWidth={maxWidth}>{content}</Content>
                {readMoreLink && (
                    <Link href={readMoreLink}>
                        <ReadMore>Read more</ReadMore>
                    </Link>
                )}
            </ContentWrapper>
        );

        return (
            <Wrapper
                className={className}
                ref={el => {
                    this.wrapper = el;
                }}
            >
                <RcTooltip
                    getTooltipContainer={() => this.wrapper}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}
                    placement={placement}
                    overlay={() => Overlay}
                >
                    {children}
                </RcTooltip>
            </Wrapper>
        );
    }
}

Tooltip.propTypes = {
    className: PropTypes.string,
    placement: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
    maxWidth: PropTypes.number,
    content: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
    readMoreLink: PropTypes.string,
};

export default Tooltip;
