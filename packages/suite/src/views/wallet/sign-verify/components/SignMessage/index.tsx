import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Input, Button, Textarea, Select, Icon, variables } from '@trezor/components';
import { Card, Translation } from '@suite-components';
import { copyToClipboard } from '@suite-utils/dom';
import { useForm, Controller } from 'react-hook-form';
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

const StyledSelect = styled(Select)`
    padding: 0;
    margin-bottom: 26px;
    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        font-size: ${variables.FONT_SIZE.TINY};
    }
`;

const StyledIcon = styled(Icon)`
    margin-left: 10px;
    margin-right: 5px;
    position: relative;
    cursor: pointer;
    top: 41%;
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

interface AddressToSign {
    address: string;
    path: string;
    accountsSelectOpt?: Array<{ label: string; value: string }>;
}
type errorsMessage = 'TR_ADDRESS_IS_NOT_VALID' | 'TR_REQUIRED_FIELD';
type Inputs = {
    address: string;
    path: string;
    signMessage: string;
    accountsSelect: { label: string; value: string; type: '' };
    signSignature: string;
};

let path: AddressToSign['address'] = ''; // fast click on copy button failed if put this inside a component
let address: AddressToSign['path'] = '';
let accountsSelectOpt: AddressToSign['accountsSelectOpt'];

const SignMessage = ({ notificationActions, account, isLocked, device }: Props) => {
    if (
        account.networkType === 'bitcoin' &&
        typeof account.addresses?.unused[0]?.address === 'string' &&
        typeof account.addresses?.unused[0]?.path === 'string'
    ) {
        const accountsSelectArr = [...account.addresses.unused, ...account.addresses.used];
        accountsSelectOpt = accountsSelectArr.map(el => ({
            label: el.address,
            value: el.path,
        }));
    } else if (account.networkType === 'ethereum') {
        address = account.descriptor;
        path = account.path;
    }

    const { getValues, setValue, errors, formState, reset, control, register } = useForm<Inputs>({
        defaultValues: {
            address,
            path,
            signMessage: '',
            accountsSelect: { label: '', value: '', type: '' },
            signSignature: '',
        },
        mode: 'onChange',
    });
    const { isValid } = formState;

    useEffect(() => {
        return () => {
            reset(); // clear inputs after coin change
        };
    }, [reset]);

    return (
        <Card title={<Translation id="TR_SIGN_MESSAGE" />} isColumn>
            <Column>
                <Row>
                    {account.networkType === 'bitcoin' && (
                        <Controller
                            as={<StyledSelect options={accountsSelectOpt} />}
                            control={control}
                            topLabel={<Translation id="TR_ADDRESS" />}
                            name="accountsSelect"
                            state={errors.accountsSelect ? 'error' : undefined}
                            onChange={([selected]) => {
                                path = selected.value;
                                address = selected.label;
                                return selected;
                            }}
                            bottomText={
                                errors.accountsSelect && (
                                    <Translation
                                        id={(errors.accountsSelect.type as any) as errorsMessage}
                                    />
                                )
                            }
                            rules={{
                                validate: {
                                    TR_REQUIRED_FIELD: (selectValue: Inputs['accountsSelect']) => {
                                        return selectValue.value.length > 0;
                                    },
                                },
                            }}
                        />
                    )}
                    {/* input is more convenient from the ability to select and copy */}
                    {account.networkType === 'ethereum' && (
                        <Input
                            topLabel={<Translation id="TR_ADDRESS" />}
                            name="address"
                            value={address}
                            type="text"
                            innerRef={register}
                            readOnly
                        />
                    )}
                    <StyledIcon
                        icon="COPY"
                        onClick={() => {
                            // eslint-disable-next-line no-unused-expressions
                            copyToClipboard(address, null)
                                ? notificationActions.addToast({ type: 'copy-to-clipboard' })
                                : notificationActions.addToast({
                                      type: 'error',
                                      error: 'Attention! Copying to the clipboard failed.', // 1. how to: <Translation id="TR_COPY_TO_CLIPBOARD_FAILED" />
                                  });
                        }}
                    />
                </Row>
                <Row>
                    <Textarea
                        topLabel={<Translation id="TR_MESSAGE" />}
                        name="signMessage"
                        rows={4}
                        maxRows={4}
                        maxLength={255}
                        state={errors.signMessage ? 'error' : undefined}
                        bottomText={
                            errors.signMessage && (
                                <Translation id={errors.signMessage.type as errorsMessage} />
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
                        name="signSignature"
                        rows={4}
                        maxRows={4}
                        maxLength={255}
                        innerRef={register}
                        readOnly
                    />
                </Row>
                <RowButtons>
                    <StyledButton onClick={() => reset()} variant="secondary">
                        <Translation id="TR_CLEAR" />
                    </StyledButton>
                    <StyledButton
                        isDisabled={isLocked() || !isValid || !device}
                        onClick={async () => {
                            let fn;
                            switch (account.networkType) {
                                case 'bitcoin': {
                                    fn = TrezorConnect.signMessage;
                                    break;
                                }
                                case 'ethereum': {
                                    fn = TrezorConnect.ethereumSignMessage;
                                    break;
                                }
                                default: {
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
                            }

                            const params = {
                                path,
                                coin: account.symbol,
                                message: getValues('signMessage'),
                                hex: false,
                                device,
                            };

                            const response = await fn(params);
                            if (response.success) {
                                setValue('signSignature', response.payload.signature);
                                notificationActions.addToast({
                                    type: 'verify-message-success',
                                });
                            } else {
                                notificationActions.addToast({
                                    type: 'sign-message-error',
                                    error: response.payload.error,
                                });
                            }
                        }}
                    >
                        <Translation id="TR_SIGN" />
                    </StyledButton>
                </RowButtons>
            </Column>
        </Card>
    );
};

export default SignMessage;
