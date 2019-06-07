import React from 'react';
import styled from 'styled-components';

const DotsWrapper = styled.span``;

const Dot = styled.span`
    &:before {
        content: '.';
    }
`;

interface Props {
    maxCount?: number;
    speed?: number;
}

interface State {
    count: number;
}

class Dots extends React.Component<Props, State> {
    state: State = {
        count: 0,
    };

    interval: NodeJS.Timer;

    willUnmount: boolean = false;

    defaultProps: { [index: string]: any } = {
        maxCount: 3,
        speed: 1000,
    };

    componentDidMount() {
        this.interval = setInterval(() => {
            if (this.willUnmount) {
                return;
            }
            if (this.state.count < this.props.maxCount) {
                this.setState(prevState => ({ count: prevState.count + 1 }));
            } else {
                this.setState({ count: 0 });
            }
        }, this.props.speed);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    render() {
        return (
            <DotsWrapper>
                {Array.from(new Array(this.props.maxCount)).map((item, index) => (
                    <Dot
                        // eslint-disable-next-line react/no-array-index-key
                        key={`dot-${index}`}
                        style={{ visibility: index < this.state.count ? 'visible' : 'hidden' }}
                    />
                ))}
            </DotsWrapper>
        );
    }
}

export default Dots;
