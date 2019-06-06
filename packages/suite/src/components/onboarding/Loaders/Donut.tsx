import React from 'react';
import styled from 'styled-components';
import { Icon, icons } from '@trezor/components';

import colors from '@suite/config/onboarding/colors';

const DonutWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;

const DonutContent = styled.div`
    position: absolute;
`;

interface DonutProps {
    progress: number;
    radius: number;
    stroke: number;
    isError?: boolean;
    isSuccess?: boolean;
}

interface DonutState {
    isMounted: boolean;
}

class Donut extends React.Component<DonutProps, DonutState> {
    isMounted: boolean = false;

    componentDidMount() {
        this.isMounted = true;
    }

    componentWillUnmount() {
        this.isMounted = false;
    }

    progress = (percent: number) =>
        this.circumference(this.normalizeRadius()) -
        (percent / 100) * this.circumference(this.normalizeRadius());

    circumference = (radius: number) => radius * 2 * Math.PI;

    normalizeRadius = () => this.props.radius - this.props.stroke;

    render() {
        const style = {
            transition: 'stroke-dashoffset 0.05s',
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            strokeDashoffset: `${this.progress(this.props.progress)}`,
            strokeDasharray: `${this.circumference(this.normalizeRadius())}  ${this.circumference(
                this.normalizeRadius(),
            )}`,
        };
        return (
            <DonutWrapper>
                <svg
                    height={this.props.radius * 2}
                    width={this.props.radius * 2}
                    style={{ position: 'absolute', zIndex: 1 }}
                >
                    <circle
                        style={{
                            ...style,
                        }}
                        stroke={this.props.isError ? colors.error : colors.brandPrimary}
                        strokeWidth={this.props.stroke}
                        fill="transparent"
                        r={this.props.radius - this.props.stroke}
                        cx={this.props.radius}
                        cy={this.props.radius}
                    />
                </svg>
                <svg
                    height={this.props.radius * 2}
                    width={this.props.radius * 2}
                    style={{ position: 'relative' }}
                >
                    <circle
                        style={{
                            ...style,
                            strokeDashoffset: `${this.progress(100)}`,
                            strokeDasharray: `${this.circumference(
                                this.normalizeRadius(),
                            )}  ${this.circumference(this.normalizeRadius())}`,
                        }}
                        stroke={this.props.isError ? colors.error : colors.grayLight}
                        strokeWidth={this.props.stroke}
                        fill="transparent"
                        r={this.props.radius - this.props.stroke}
                        cx={this.props.radius}
                        cy={this.props.radius}
                    />
                </svg>
                {this.props.progress > 0 && (
                    <DonutContent>
                        {this.props.isSuccess && <Icon icon={icons.SUCCESS} color={colors.white} />}
                        {this.props.isError && <Icon icon={icons.ERROR} color={colors.error} />}
                        {!this.props.isError && !this.props.isSuccess && (
                            <div>{this.props.progress} %</div>
                        )}
                    </DonutContent>
                )}
            </DonutWrapper>
        );
    }
}

export default Donut;
