/* @flow */

import * as React from 'react';
import raf from 'raf';
import { getViewportHeight, getScrollX, getScrollY } from 'utils/windowUtils';
import styled from 'styled-components';
import colors from 'config/colors';

type Props = {
    children?: React.Node,
}

type State = {
    prevScrollY: number;
    asideMinHeight: number,
    wrapperTopOffset: number,
    wrapperLeftOffset: number,
    wrapperBottomPadding: number,
    footerFixed: boolean,
}

const AsideWrapper = styled.aside.attrs(props => ({
    style: { minHeight: props.minHeight },
}))`

    position: relative;
    top: 0px;
    width: 320px;
    min-width: 320px;
    overflow: hidden;
    background: ${colors.MAIN};
    border-right: 1px solid ${colors.DIVIDER};
    border-top-left-radius: 4px;
    
    @media screen and (max-width: 1170px) {
        border-top-left-radius: 0px;
    }
`;

const StickyContainerWrapper = styled.div.attrs(props => ({
    style: {
        top: props.top,
        left: props.left,
        paddingBottom: props.paddingBottom,
    },
}))`
    position: fixed;
    border-right: 1px solid ${colors.DIVIDER};
    width: 320px;
    overflow: hidden;
`;

export default class StickyContainer extends React.PureComponent<Props, State> {
    constructor() {
        super();
        this.state = {
            prevScrollY: 0,
            asideMinHeight: 0,
            wrapperTopOffset: 0,
            wrapperLeftOffset: 0,
            wrapperBottomPadding: 0,
            footerFixed: false,
        };
    }

    componentDidMount() {
        window.addEventListener('scroll', this.handleScroll);
        window.addEventListener('resize', this.handleScroll);
        this.update();
    }

    componentDidUpdate(prevProps: Props, newState: State) {
        // recalculate view only if props was changed
        // ignore when state is changed
        if (this.state === newState) raf(this.update);
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleScroll);
    }

    update = () => {
        this.recalculatePosition();
    }

    handleScroll = () => raf(this.update);

    asideRefCallback = (element: ?HTMLElement) => {
        this.aside = element;
    }

    wrapperRefCallback = (element: ?HTMLElement) => {
        this.wrapper = element;
    }

    footerRefCallback = (element: ?HTMLElement) => {
        this.footer = element;
    }

    aside: ?HTMLElement;

    wrapper: ?HTMLElement;

    footer: ?HTMLElement;

    recalculatePosition() {
        const { aside, wrapper, footer } = this;
        if (!aside || !wrapper || !footer) return;

        const viewportHeight = getViewportHeight();
        const asideBounds = aside.getBoundingClientRect();
        const wrapperBounds = wrapper.getBoundingClientRect();
        const footerBounds = footer.getBoundingClientRect();
        const isHeaderFixed = asideBounds.top < 0;
        const isWrapperBiggerThanViewport = wrapperBounds.height > viewportHeight;
        const state = { ...this.state };

        const scrollX = getScrollX();
        const scrollY = getScrollY();

        if (isHeaderFixed) {
            if (isWrapperBiggerThanViewport) {
                const scrollDirection = scrollY >= state.prevScrollY ? 'down' : 'up';
                const topOutOfBounds: boolean = (wrapperBounds.top > 0 && scrollDirection === 'up');
                const bottomOutOfBounds: boolean = (footerBounds.bottom <= viewportHeight && scrollDirection === 'down');
                if (!topOutOfBounds && !bottomOutOfBounds) {
                    // neither "top" or "bottom" was reached
                    // scroll whole wrapper
                    const distanceScrolled = Math.abs(scrollY - state.prevScrollY);
                    state.wrapperTopOffset += scrollDirection === 'down' ? -distanceScrolled : distanceScrolled;
                }
            }
            // make sure that wrapper will not be over scrolled
            if (state.wrapperTopOffset > 0) state.wrapperTopOffset = 0;
            const maxScrollTop = viewportHeight - wrapperBounds.height;
            if (maxScrollTop < 0 && state.wrapperTopOffset < maxScrollTop) state.wrapperTopOffset = maxScrollTop;
        } else {
            // update wrapper "top" to be same as "aside" element
            state.wrapperTopOffset = asideBounds.top;
        }

        if (isWrapperBiggerThanViewport) {
            state.footerFixed = false;
        } else if (state.footerFixed) {
            if (footerBounds.top < wrapperBounds.bottom - footerBounds.height) {
                state.footerFixed = false;
            }
        } else if (footerBounds.bottom < viewportHeight) {
            state.footerFixed = asideBounds.height > wrapperBounds.height;
        }

        state.prevScrollY = scrollY;
        state.asideMinHeight = wrapperBounds.height;
        state.wrapperBottomPadding = state.footerFixed ? footerBounds.height : 0;
        // update wrapper "left" position
        state.wrapperLeftOffset = scrollX > 0 ? -scrollX : asideBounds.left;

        this.setState(state);
    }

    render() {
        return (
            <AsideWrapper
                footerFixed={this.state.footerFixed}
                minHeight={this.state.asideMinHeight}
                ref={this.asideRefCallback}
                onScroll={this.handleScroll}
                onTouchStart={this.handleScroll}
                onTouchMove={this.handleScroll}
                onTouchEnd={this.handleScroll}
            >
                <StickyContainerWrapper
                    paddingBottom={this.state.wrapperBottomPadding}
                    top={this.state.wrapperTopOffset}
                    left={this.state.wrapperLeftOffset}
                    ref={this.wrapperRefCallback}
                >
                    {React.Children.map(this.props.children, (child) => { // eslint-disable-line arrow-body-style
                        return child.key === 'sticky-footer' ? React.cloneElement(child, {
                            ref: this.footerRefCallback,
                            position: this.state.footerFixed ? 'fixed' : 'relative',
                        }) : child;
                    })}
                </StickyContainerWrapper>
            </AsideWrapper>
        );
    }
}