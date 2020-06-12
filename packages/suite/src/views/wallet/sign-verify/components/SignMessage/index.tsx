import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Input, Button, Textarea, Select, Icon, variables } from '@trezor/components';
import { Card, Translation } from '@suite-components';
import { copyToClipboard } from '@suite-utils/dom';
import { useForm, Controller } from 'react-hook-form';
import { ChildProps as Props } from '../../Container';
import TrezorConnect from 'trezor-connect';

const Column = styled.div`
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex: 1 1 100%;
    }
`;

const StyledSelect = styled(Select)`
    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        font-size: ${variables.FONT_SIZE.TINY};
    }
`;

const StyledIcon = styled(Icon)`
    margin-left: 10px;
    margin-right: 5px;
    position: relative;
    cursor: pointer;
`;
let CopyIcon = styled(StyledIcon)`
    top: 55%;
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

type Inputs = {
    address: string;
    path: string;
    signMessage: string;
    accountsSelect: { label: string; value: string };
    signSignature: string;
};

let path: AddressToSign['address'] = '';
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
        CopyIcon = styled(StyledIcon)`
            top: 41%;
        `;
    }

    const { getValues, setValue, errors, formState, reset, control, register } = useForm<Inputs>({
        defaultValues: {
            address,
            path,
            signMessage: '',
            accountsSelect: { label: '', value: '' },
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
        <Card title={<Translation id="TR_SIGN_MESSAGE" />}>
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
                                errors.accountsSelect ? (
                                    <Translation id={errors.accountsSelect.type} />
                                ) : (
                                    ''
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
                    <CopyIcon
                        icon="COPY"
                        onClick={() => {
                            // eslint-disable-next-line no-unused-expressions
                            copyToClipboard(address, null)
                                ? notificationActions.addToast({ type: 'copy-to-clipboard' })
                                : notificationActions.addToast({
                                      type: 'error',
                                      error: 'Attention! Copying to the clipboard failed.', // 2. how to: <Translation id="TR_COPY_TO_CLIPBOARD_FAILED" />
                                  });
                        }}
                    />
                </Row>
                <Row>
                    <Controller
                        as={
                            <Textarea
                                topLabel={<Translation id="TR_MESSAGE" />}
                                rows={4}
                                maxRows={4}
                                maxLength={255}
                                state={errors.signMessage ? 'error' : undefined}
                                bottomText={
                                    errors.signMessage ? (
                                        <Translation id={errors.signMessage.type} />
                                    ) : (
                                        ''
                                    )
                                }
                            />
                        }
                        name="signMessage"
                        control={control}
                        defaultValue=""
                        rules={{
                            validate: {
                                TR_REQUIRED_FIELD: (value: string) => {
                                    return value.length > 0;
                                },
                            },
                        }}
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
                        // isDisabled={isLocked() || !isValid}
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
