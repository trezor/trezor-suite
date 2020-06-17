import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Input, Button, Textarea, variables } from '@trezor/components';
import { Card, Translation } from '@suite-components';
import { useForm } from 'react-hook-form';
import { isAddressValid } from '@wallet-utils/validation';
import { ChildProps as Props } from '../../Container';
import TrezorConnect from 'trezor-connect';

const ApperAnimation = keyframes`
 0% { opacity: 0; }
 10% { opacity: 0.1; }
 30% { opacity: 0.3; }
 70% {  opacity: 0.7;}
 80% {  opacity: 0.8;}
 90% {  opacity: 0.9;}
 100% { opacity: 1; }
`;

const Column = styled.div`
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    animation-name: ${ApperAnimation};
    animation-duration: 0.6s;
    animation-iteration-count: 1;
    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex: 1 1 100%;
    }
`;
const Row = styled.div`
    padding-bottom: 28px;
    display: flex;
`;
const RowButtons = styled(Row)`
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;
const StyledButton = styled(Button)`
    width: 110px;
    margin-left: 10px;

    &:first-child {
        margin-left: 0;
    }
`;
type errorsMessage = 'TR_ADDRESS_IS_NOT_VALID' | 'TR_REQUIRED_FIELD';

const VerifyMessage = ({ notificationActions, account, isLocked, device }: Props) => {
    const { register, getValues, errors, formState, reset } = useForm({
        mode: 'onChange',
        defaultValues: {
            verifyAddressInput: '',
            verifyMessage: '',
            verifySignature: '',
        },
    });

    const { isValid } = formState;

    useEffect(() => {
        return () => {
            reset(); // clear inputs after coin change
        };
    }, [reset]);

    return (
        <Card title={<Translation id="TR_VERIFY_MESSAGE" />} isColumn>
            <Column>
                <Row>
                    <Input
                        topLabel={<Translation id="TR_ADDRESS" />}
                        name="verifyAddressInput"
                        type="text"
                        state={errors.verifyAddressInput ? 'error' : undefined}
                        bottomText={
                            errors.verifyAddressInput && (
                                <Translation id={errors.verifyAddressInput.type as errorsMessage} />
                            )
                        }
                        innerRef={register({
                            validate: {
                                TR_ADDRESS_IS_NOT_VALID: (value: string) => {
                                    if (value) {
                                        return isAddressValid(value, account.symbol);
                                    }
                                },
                            },
                        })}
                    />
                </Row>
                <Row>
                    <Textarea
                        topLabel={<Translation id="TR_MESSAGE" />}
                        name="verifyMessage"
                        rows={4}
                        maxRows={4}
                        maxLength={255}
                        state={errors.verifyMessage ? 'error' : undefined}
                        bottomText={
                            errors.verifyMessage && (
                                <Translation id={errors.verifyMessage.type as errorsMessage} />
                            )
                        }
                        innerRef={register({
                            validate: {
                                TR_REQUIRED_FIELD: (value: string) => {
                                    return value.length > 0;
                                },
                            },
                        })}
                    />
                </Row>
                <Row>
                    <Textarea
                        topLabel={<Translation id="TR_SIGNATURE" />}
                        name="verifySignature"
                        rows={4}
                        maxRows={4}
                        maxLength={255}
                        state={errors.verifySignature ? 'error' : undefined}
                        bottomText={
                            errors.verifySignature && (
                                <Translation id={errors.verifySignature.type as errorsMessage} />
                            )
                        }
                        innerRef={register({
                            validate: {
                                TR_REQUIRED_FIELD: (value: string) => {
                                    return value.length > 0;
                                },
                            },
                        })}
                    />
                </Row>
                <RowButtons>
                    <StyledButton onClick={() => reset()} variant="secondary">
                        <Translation id="TR_CLEAR" />
                    </StyledButton>
                    <StyledButton
                        isDisabled={!isValid || isLocked() || !device}
                        onClick={async () => {
                            let fn;
                            const params = {
                                address: getValues('verifyAddressInput'),
                                message: getValues('verifyMessage'),
                                signature: getValues('verifySignature'),
                                coin: account.symbol,
                                hex: false,
                            };

                            switch (account.networkType) {
                                case 'bitcoin':
                                    fn = TrezorConnect.verifyMessage;
                                    break;
                                case 'ethereum':
                                    fn = TrezorConnect.ethereumVerifyMessage;
                                    break;
                                default:
                                    fn = () => ({
                                        success: false,
                                        payload: {
                                            error: `Unsupported network: ${account.networkType}`,
                                            code: undefined,
                                            signature: '',
                                        },
                                    });
                                    break;
                            }

                            const response = await fn(params);

                            if (response.success) {
                                notificationActions.addToast({
                                    type: 'verify-message-success',
                                });
                            } else {
                                notificationActions.addToast({
                                    type: 'verify-message-error',
                                    error: response.payload.error,
                                });
                            }
                        }}
                    >
                        <Translation id="TR_VERIFY" />
                    </StyledButton>
                </RowButtons>
            </Column>
        </Card>
    );
};
export default VerifyMessage;
