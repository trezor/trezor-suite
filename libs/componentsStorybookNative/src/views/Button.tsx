import React from 'react';
import styled from 'styled-components/native';
import { Button, ButtonPin, H1, H5 } from '@trezor/components';

const Wrapper = styled.View`
    padding: 10px;
`;

const Row = styled.View`
    flex-direction: row;
`;

const Buttons = () => {
    return (
        <Wrapper>
            <H1>Basic</H1>
            <Row>
                <Button variant="success" data-test="button_basic_success" onClick={() => {}}>
                    Button
                </Button>
                <Button variant="info" data-test="button_basic_info" onClick={() => {}}>
                    Button
                </Button>
                <Button variant="warning" data-test="button_basic_warning" onClick={() => {}}>
                    Button
                </Button>
                <Button variant="error" data-test="button_basic_error" onClick={() => {}}>
                    Button
                </Button>
            </Row>
            <Row>
                <Button data-test="button_basic_white" isWhite onClick={() => {}}>
                    White
                </Button>
                <Button data-test="button_basic_transparent" isTransparent onClick={() => {}}>
                    Transparent
                </Button>
                <Button data-test="button_basic_disabled" isDisabled onClick={() => {}}>
                    Disabled
                </Button>
            </Row>

            <H5>with an icon</H5>
            <Row>
                <Button
                    icon="PLUS"
                    variant="success"
                    data-test="button_icon_success"
                    onClick={() => {}}
                >
                    Button
                </Button>
                <Button icon="PLUS" variant="info" data-test="button_icon_info" onClick={() => {}}>
                    Button
                </Button>
                <Button
                    icon="PLUS"
                    variant="warning"
                    data-test="button_icon_warning"
                    onClick={() => {}}
                >
                    Button
                </Button>
                <Button
                    icon="PLUS"
                    variant="error"
                    data-test="button_icon_error"
                    onClick={() => {}}
                >
                    Button
                </Button>
            </Row>
            <Row>
                <Button icon="PLUS" isWhite data-test="button_icon_white" onClick={() => {}}>
                    White
                </Button>
                <Button
                    icon="PLUS"
                    isTransparent
                    data-test="button_icon_transparent"
                    onClick={() => {}}
                >
                    Transparent
                </Button>
                <Button icon="PLUS" isDisabled data-test="button_icon_disabled" onClick={() => {}}>
                    Disabled
                </Button>
            </Row>

            <H5>with loading</H5>
            <Row>
                <Button
                    isLoading
                    variant="success"
                    data-test="button_loading_success"
                    onClick={() => {}}
                >
                    Button
                </Button>
                <Button isLoading variant="info" data-test="button_loading_info" onClick={() => {}}>
                    Button
                </Button>
                <Button
                    isLoading
                    variant="warning"
                    data-test="button_loading_warning"
                    onClick={() => {}}
                >
                    Button
                </Button>
                <Button
                    isLoading
                    variant="error"
                    data-test="button_loading_error"
                    onClick={() => {}}
                >
                    Button
                </Button>
            </Row>
            <Row>
                <Button isLoading isWhite data-test="button_loading_white" onClick={() => {}}>
                    White
                </Button>
                <Button
                    isLoading
                    isTransparent
                    data-test="button_loading_transparent"
                    onClick={() => {}}
                >
                    Transparent
                </Button>
                <Button isLoading isDisabled data-test="button_loading_disabled" onClick={() => {}}>
                    Disabled
                </Button>
            </Row>

            <H1>Inverse</H1>
            <Row>
                <Button
                    isInverse
                    variant="success"
                    data-test="button_inverse_success"
                    onClick={() => {}}
                >
                    Button
                </Button>
                <Button isInverse variant="info" data-test="button_inverse_info" onClick={() => {}}>
                    Button
                </Button>
                <Button
                    isInverse
                    variant="warning"
                    data-test="button_inverse_warning"
                    onClick={() => {}}
                >
                    Button
                </Button>
                <Button
                    isInverse
                    variant="error"
                    data-test="button_inverse_error"
                    onClick={() => {}}
                >
                    Button
                </Button>
            </Row>
            <Row>
                <Button isInverse isWhite data-test="button_inverse_white" onClick={() => {}}>
                    White
                </Button>
                <Button
                    isInverse
                    isTransparent
                    data-test="button_inverse_transparent"
                    onClick={() => {}}
                >
                    Transparent
                </Button>
                <Button isInverse isDisabled data-test="button_inverse_disabled" onClick={() => {}}>
                    Disabled
                </Button>
            </Row>

            <H5>with an icon</H5>
            <Row>
                <Button
                    isInverse
                    icon="PLUS"
                    variant="success"
                    data-test="button_inverse_icon_success"
                    onClick={() => {}}
                >
                    Button
                </Button>
                <Button
                    isInverse
                    icon="PLUS"
                    variant="info"
                    data-test="button_inverse_icon_info"
                    onClick={() => {}}
                >
                    Button
                </Button>
                <Button
                    isInverse
                    icon="PLUS"
                    variant="warning"
                    data-test="button_inverse_icon_warning"
                    onClick={() => {}}
                >
                    Button
                </Button>
                <Button
                    isInverse
                    icon="PLUS"
                    variant="error"
                    data-test="button_inverse_icon_error"
                    onClick={() => {}}
                >
                    Button
                </Button>
            </Row>
            <Row>
                <Button
                    isInverse
                    icon="PLUS"
                    isWhite
                    data-test="button_inverse_icon_white"
                    onClick={() => {}}
                >
                    White
                </Button>
                <Button
                    isInverse
                    icon="PLUS"
                    isTransparent
                    data-test="button_inverse_icon_transparent"
                    onClick={() => {}}
                >
                    Transparent
                </Button>
                <Button
                    isInverse
                    icon="PLUS"
                    isDisabled
                    data-test="button_inverse_icon_disabled"
                    onClick={() => {}}
                >
                    Disabled
                </Button>
            </Row>

            <H5>with loading</H5>
            <Row>
                <Button
                    isInverse
                    isLoading
                    variant="success"
                    data-test="button_inverse_loading_success"
                    onClick={() => {}}
                >
                    Button
                </Button>
                <Button
                    isInverse
                    isLoading
                    variant="info"
                    data-test="button_inverse_loading_info"
                    onClick={() => {}}
                >
                    Button
                </Button>
                <Button
                    isInverse
                    isLoading
                    variant="warning"
                    data-test="button_inverse_loading_warning"
                    onClick={() => {}}
                >
                    Button
                </Button>
                <Button
                    isInverse
                    isLoading
                    variant="error"
                    data-test="button_inverse_loading_error"
                    onClick={() => {}}
                >
                    Button
                </Button>
            </Row>
            <Row>
                <Button
                    isInverse
                    isLoading
                    isWhite
                    data-test="button_inverse_loading_white"
                    onClick={() => {}}
                >
                    White
                </Button>
                <Button
                    isInverse
                    isLoading
                    isTransparent
                    data-test="button_inverse_loading_transparent"
                    onClick={() => {}}
                >
                    Transparent
                </Button>
                <Button
                    isInverse
                    isLoading
                    isDisabled
                    data-test="button_inverse_loading_disabled"
                    onClick={() => {}}
                >
                    Disabled
                </Button>
            </Row>
            <H1>Pin</H1>
            <Row>
                <ButtonPin onClick={() => {}} />
            </Row>
        </Wrapper>
    );
};

export default Buttons;
