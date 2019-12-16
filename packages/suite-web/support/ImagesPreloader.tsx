import React, { Component } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: none;
`;

const Img = styled.img``;

class ImagesPreloader extends Component {
    // @ts-ignore
    importAll(r) {
        return r.keys().map(r);
    }

    render() {
        const images = this.importAll(
            require.context('../public/static/images', true, /\.(png|jpe?g)$/),
        );
        return (
            <Wrapper>
                {images.map((image: string) => (
                    <Img key={image} src={image} />
                ))}
            </Wrapper>
        );
    }
}

export default ImagesPreloader;
