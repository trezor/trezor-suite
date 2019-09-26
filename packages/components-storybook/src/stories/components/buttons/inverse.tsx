import React from 'react';
import styled from 'styled-components';
import { Button, H1, H5 } from '@trezor/components';
import { storiesOf } from '@storybook/react';

const Wrapper = styled.div`
    padding: 1.6rem;
`;

const Row = styled.div`
    display: flex;
    margin: 0.5rem 0 2rem;
    flex-wrap: wrap;

    button {
        margin: 10px 10px;
    }
`;

const Div = styled.div`
    margin: 0.5rem 0 2rem;
`;
const SnapshotWrapper = styled.div`
    display: inline-flex;
`;
const SnapshotWrapperDiv = styled.div``;

storiesOf('Buttons', module).add(
    'Inverse',
    () => (
        <Wrapper>
            <H1>Inverse </H1>
            <Row>
                <SnapshotWrapper data-test="button_inverse">
                    <Button isInverse variant="success">
                        Button
                    </Button>
                    <Button isInverse variant="info">
                        Button
                    </Button>
                    <Button isInverse variant="warning">
                        Button
                    </Button>
                    <Button isInverse variant="error">
                        Button
                    </Button>
                    <Button isInverse variant="white">
                        Button
                    </Button>
                </SnapshotWrapper>
            </Row>

            <H5>with an icon </H5>
            <Row>
                <SnapshotWrapper data-test="button_inverse_icon">
                    <Button isInverse icon="PLUS" variant="success">
                        Button
                    </Button>
                    <Button isInverse icon="PLUS" variant="info">
                        Button
                    </Button>
                    <Button isInverse icon="PLUS" variant="warning">
                        Button
                    </Button>
                    <Button isInverse icon="PLUS" variant="error">
                        Button
                    </Button>
                    <Button isInverse icon="PLUS" variant="white">
                        Button
                    </Button>
                </SnapshotWrapper>
            </Row>

            <H5>with loading </H5>
            <Row>
                <SnapshotWrapper data-test="button_inverse_loading">
                    <Button isInverse isLoading variant="success">
                        Button
                    </Button>
                    <Button isInverse isLoading variant="info">
                        Button
                    </Button>
                    <Button isInverse isLoading variant="warning">
                        Button
                    </Button>
                    <Button isInverse isLoading variant="error">
                        Button
                    </Button>
                    <Button isInverse isLoading variant="white">
                        Button
                    </Button>
                </SnapshotWrapper>
            </Row>

            <H1>Inverse - full width </H1>
            <Div>
                <SnapshotWrapperDiv data-test="button_inverse_full_width">
                    <Button fullWidth isInverse variant="success">
                        Button
                    </Button>
                    <Button fullWidth isInverse variant="info">
                        Button
                    </Button>
                    <Button fullWidth isInverse variant="warning">
                        Button
                    </Button>
                    <Button fullWidth isInverse variant="error">
                        Button
                    </Button>
                    <Button fullWidth isInverse variant="white">
                        Button
                    </Button>
                </SnapshotWrapperDiv>
            </Div>

            <H5>with an icon</H5>
            <Div>
                <SnapshotWrapperDiv data-test="button_inverse_icon_full_width">
                    <Button fullWidth isInverse icon="PLUS" variant="success">
                        Button
                    </Button>
                    <Button fullWidth isInverse icon="PLUS" variant="info">
                        Button
                    </Button>
                    <Button fullWidth isInverse icon="PLUS" variant="warning">
                        Button
                    </Button>
                    <Button fullWidth isInverse icon="PLUS" variant="error">
                        Button
                    </Button>
                    <Button fullWidth isInverse icon="PLUS" variant="white">
                        Button
                    </Button>
                </SnapshotWrapperDiv>
            </Div>

            <H5>with loading </H5>
            <Div>
                <SnapshotWrapperDiv data-test="button_inverse_loading_full_width">
                    <Button fullWidth isInverse isLoading variant="success">
                        Button
                    </Button>
                    <Button fullWidth isInverse isLoading variant="info">
                        Button
                    </Button>
                    <Button fullWidth isInverse isLoading variant="warning">
                        Button
                    </Button>
                    <Button fullWidth isInverse isLoading variant="error">
                        Button
                    </Button>
                    <Button fullWidth isInverse isLoading variant="white">
                        Button
                    </Button>
                </SnapshotWrapperDiv>
            </Div>

            <H1>Inverse - right aligned full width </H1>
            <Div>
                <SnapshotWrapperDiv data-test="button_inverse_full_width_right">
                    <Button fullWidth isInverse variant="success" align="right">
                        Button
                    </Button>
                    <Button fullWidth isInverse variant="info" align="right">
                        Button
                    </Button>
                    <Button fullWidth isInverse variant="warning" align="right">
                        Button
                    </Button>
                    <Button fullWidth isInverse variant="error" align="right">
                        Button
                    </Button>
                    <Button fullWidth isInverse variant="white" align="right">
                        Button
                    </Button>
                </SnapshotWrapperDiv>
            </Div>

            <H5>with an icon </H5>
            <Div>
                <SnapshotWrapperDiv data-test="button_inverse_icon_full_width_right">
                    <Button fullWidth isInverse icon="PLUS" variant="success" align="right">
                        Button
                    </Button>
                    <Button fullWidth isInverse icon="PLUS" variant="info" align="right">
                        Button
                    </Button>
                    <Button fullWidth isInverse icon="PLUS" variant="warning" align="right">
                        Button
                    </Button>
                    <Button fullWidth isInverse icon="PLUS" variant="error" align="right">
                        Button
                    </Button>
                    <Button fullWidth isInverse icon="PLUS" variant="white" align="right">
                        Button
                    </Button>
                </SnapshotWrapperDiv>
            </Div>

            <H5>with loading </H5>
            <Div>
                <SnapshotWrapperDiv data-test="button_inverse_loading_full_width_right">
                    <Button fullWidth isInverse isLoading variant="success" align="right">
                        Button
                    </Button>
                    <Button fullWidth isInverse isLoading variant="info" align="right">
                        Button
                    </Button>
                    <Button fullWidth isInverse isLoading variant="warning" align="right">
                        Button
                    </Button>
                    <Button fullWidth isInverse isLoading variant="error" align="right">
                        Button
                    </Button>
                    <Button fullWidth isInverse isLoading variant="white" align="right">
                        Button
                    </Button>
                </SnapshotWrapperDiv>
            </Div>

            <H1>Inverse - full width aligned left</H1>
            <Div>
                <SnapshotWrapperDiv data-test="button_inverse_full_width_left">
                    <Button fullWidth isInverse variant="success" align="left">
                        Button
                    </Button>
                    <Button fullWidth isInverse variant="info" align="left">
                        Button
                    </Button>
                    <Button fullWidth isInverse variant="warning" align="left">
                        Button
                    </Button>
                    <Button fullWidth isInverse variant="error" align="left">
                        Button
                    </Button>
                    <Button fullWidth isInverse variant="white" align="left">
                        Button
                    </Button>
                </SnapshotWrapperDiv>
            </Div>

            <H5>with an icon </H5>
            <Div>
                <SnapshotWrapperDiv data-test="button_inverse_icon_full_width_left">
                    <Button fullWidth isInverse icon="PLUS" variant="success" align="left">
                        Button
                    </Button>
                    <Button fullWidth isInverse icon="PLUS" variant="info" align="left">
                        Button
                    </Button>
                    <Button fullWidth isInverse icon="PLUS" variant="warning" align="left">
                        Button
                    </Button>
                    <Button fullWidth isInverse icon="PLUS" variant="error" align="left">
                        Button
                    </Button>
                    <Button fullWidth isInverse icon="PLUS" variant="white" align="left">
                        Button
                    </Button>
                </SnapshotWrapperDiv>
            </Div>

            <H5>with loading </H5>
            <Div>
                <SnapshotWrapperDiv data-test="button_inverse_full_width_left_loading">
                    <Button fullWidth isInverse isLoading variant="success" align="left">
                        Button
                    </Button>
                    <Button fullWidth isInverse isLoading variant="info" align="left">
                        Button
                    </Button>
                    <Button fullWidth isInverse isLoading variant="warning" align="left">
                        Button
                    </Button>
                    <Button fullWidth isInverse isLoading variant="error" align="left">
                        Button
                    </Button>
                    <Button fullWidth isInverse isLoading variant="white" align="left">
                        Button
                    </Button>
                </SnapshotWrapperDiv>
            </Div>
        </Wrapper>
    ),
    {
        info: {
            disable: true,
        },
    }
);
