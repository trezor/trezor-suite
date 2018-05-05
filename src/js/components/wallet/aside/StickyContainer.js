/* @flow */
'use strict';

// https://github.com/KyleAMathews/react-headroom/blob/master/src/shouldUpdate.js

import React, { PureComponent } from 'react';
import raf from 'raf';
import { getViewportHeight, getScrollY } from '../../../utils/windowUtils';

type Props = {
    location: any,
    devices: any,
    children: any,
}

export default class StickyContainer extends PureComponent<Props> {

    // Class variables.
    currentScrollY: number = 0;
    lastKnownScrollY: number = 0;
    topOffset: number = 0;

    framePending: boolean = false;
    stickToBottom: boolean = false;
    top: number = 0;
    aside: ?HTMLElement;
    wrapper: ?HTMLElement;
    subscribers = [];

    handleResize = (event: Event) => {

    }

    handleScroll = (event: ?Event) => {
        if (!this.framePending) {
            this.framePending = true;
            raf(this.update);
        }
    }

    shouldUpdate = () => {
        const wrapper: ?HTMLElement = this.wrapper;
        const aside: ?HTMLElement = this.aside;
        if (!wrapper || !aside) return;
        const helpButton: ?HTMLElement = wrapper.querySelector('.help');
        if (!helpButton) return;

        
        const viewportHeight: number = getViewportHeight();
        const helpButtonBounds = helpButton.getBoundingClientRect();
        const asideBounds = aside.getBoundingClientRect();
        const wrapperBounds = wrapper.getBoundingClientRect();

        const scrollDirection = this.currentScrollY >= this.lastKnownScrollY ? 'down' : 'up';
        const distanceScrolled = Math.abs(this.currentScrollY - this.lastKnownScrollY);

        if (asideBounds.top < 0) {
            wrapper.classList.add('fixed');
            let maxTop : number= 1;
            if (wrapperBounds.height > viewportHeight) {
                const bottomOutOfBounds: boolean = (helpButtonBounds.bottom <= viewportHeight && scrollDirection === 'down');
                const topOutOfBounds: boolean = (wrapperBounds.top > 0 && scrollDirection === 'up');
                if (!bottomOutOfBounds && !topOutOfBounds) {
                    this.topOffset += scrollDirection === 'down' ? - distanceScrolled : distanceScrolled;
                }
                maxTop = viewportHeight - wrapperBounds.height;
            }

            if (this.topOffset > 0) this.topOffset = 0;
            if (maxTop < 0 && this.topOffset < maxTop) this.topOffset = maxTop;
            wrapper.style.top = `${this.topOffset}px`;

        } else {
            wrapper.classList.remove('fixed');
            wrapper.style.top = `0px`;
            this.topOffset = 0;
        }

        if (wrapperBounds.height > viewportHeight) {
            wrapper.classList.remove('fixed-bottom');
        } else {
            if (wrapper.classList.contains('fixed-bottom')) {
                if (helpButtonBounds.top < wrapperBounds.bottom - helpButtonBounds.height) {
                    wrapper.classList.remove('fixed-bottom');
                }
            } else if (helpButtonBounds.bottom < viewportHeight) {
                wrapper.classList.add('fixed-bottom');
            }
        }
        
        aside.style.minHeight = `${ wrapperBounds.height }px`;
    }

    update = () => {
        this.currentScrollY = getScrollY();
        this.shouldUpdate();
        this.framePending = false;
        this.lastKnownScrollY = this.currentScrollY;
    }

    componentDidMount() {
        window.addEventListener('scroll', this.handleScroll);
        window.addEventListener('resize', this.handleScroll);
        this.handleScroll(null);
    }
    
    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleScroll);
    }

    componentDidUpdate(prevProps: Props) {
        if (this.props.location !== prevProps.location && this.aside) {
            const asideBounds = this.aside.getBoundingClientRect();
            if (asideBounds.top < 0) {
                window.scrollTo(0, getScrollY() + asideBounds.top);
                this.topOffset = 0;
                raf(this.update);
            }
        }

        if (this.props.devices !== prevProps.devices) {
            raf(this.update);
        }
    }

    render() {
        return (
          <aside
            { ...this.props }
            ref={ node => this.aside = node }
            onScroll={this.handleScroll}
            onTouchStart={this.handleScroll}
            onTouchMove={this.handleScroll}
            onTouchEnd={this.handleScroll}
          >
            <div
                className="sticky-container" 
                ref={ node => this.wrapper = node }>
                { this.props.children }
            </div>
          </aside>
        );
    }
}