import { useState } from 'react';
import { useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import {
    MAX_LENGTH_MESSAGE,
    MAX_LENGTH_SIGNATURE,
    type SignAddressGroup,
} from '@suite-common/sign-verify';
import { type TrezorDevice } from '@suite-common/suite-types';
import {
    Badge,
    HStack,
    type SelectItemType,
    type SubTabItem,
    SubTabs,
    VStack,
} from '@suite-native/atoms';
import { useDeviceReadyEvents } from '@suite-native/device-authorization';
import { useForm, useWatch, yup } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import {
    type SignError,
    type SignedMessage,
    type VerifyError,
} from '@trezor/network-module-suite-common-types';
import { type Result, exhaustive } from '@trezor/type-utils';
import { isHex } from '@trezor/utils';

import { SignMessageCard } from './SignMessageCard';
import { type SignFormValues, type VerifyFormValues } from './SignVerifyFormValues';
import { VerifyMessageCard } from './VerifyMessageCard';

type Tab = 'sign' | 'verify';

type VerifyOutcome = 'verified' | 'failed';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

type SignMessageParams<TFormat extends string> = {
    device: TrezorDevice | undefined;
    path: string;
    message: string;
    hex: boolean;
    format: TFormat | undefined;
};

type VerifyMessageParams = VerifyFormValues & {
    device: TrezorDevice | undefined;
    hex: boolean;
};

// Rejecting the prompt on the device says nothing about the signature, the check never ran.
const getVerifyOutcome = (result: Result<void, VerifyError>): VerifyOutcome | undefined => {
    if (result.success) {
        return 'verified';
    }

    switch (result.error.type) {
        case 'DeviceCancelled':
            return undefined;
        case 'DeviceError':
        case 'DeviceNotConnectedError':
            return 'failed';
        default:
            return exhaustive(result.error);
    }
};

type SignVerifyFormsProps<TFormat extends string> = {
    addressGroups: SignAddressGroup[];
    formats?: SelectItemType<TFormat>[];
    defaultFormat?: TFormat;
    signMessage: (params: SignMessageParams<TFormat>) => Promise<Result<SignedMessage, SignError>>;
    verifyMessage?: (params: VerifyMessageParams) => Promise<Result<void, VerifyError>>;
};

export const SignVerifyForms = <TFormat extends string = never>({
    addressGroups,
    formats,
    defaultFormat,
    signMessage,
    verifyMessage,
}: SignVerifyFormsProps<TFormat>) => {
    const navigation = useNavigation<NavigationProps>();
    const { waitForDevice } = useDeviceReadyEvents();
    const store = useStore<DeviceRootState>();
    const { translate } = useTranslate();

    const [activeTab, setActiveTab] = useState<Tab>('sign');
    const [isSigned, setIsSigned] = useState(false);
    const [verifyOutcome, setVerifyOutcome] = useState<VerifyOutcome>();

    const addresses = addressGroups.flatMap(group => group.addresses);

    const signForm = useForm<SignFormValues>({
        validation: yup.object({
            format: yup.string(),
            address: yup.string().required(),
            message: yup
                .string()
                .required()
                .max(MAX_LENGTH_MESSAGE)
                .when('hex', {
                    is: true,
                    then: schema =>
                        schema.test('isHex', translate('signAndVerify.hex.invalid'), value =>
                            isHex(value, { prefix: 'optional', allowEmpty: false }),
                        ),
                }),
            hex: yup.boolean().required(),
            signature: yup.string().defined(),
        }),
        defaultValues: {
            format: defaultFormat,
            address: addresses.length === 1 ? addresses[0]?.address : '',
            message: '',
            hex: false,
            signature: '',
        },
        mode: 'onSubmit',
    });

    const verifyForm = useForm<VerifyFormValues>({
        validation: yup.object({
            address: yup.string().required(),
            message: yup.string().required().max(MAX_LENGTH_MESSAGE),
            signature: yup.string().required().max(MAX_LENGTH_SIGNATURE),
        }),
        defaultValues: { address: '', message: '', signature: '' },
        mode: 'onSubmit',
    });

    const message = useWatch({ control: signForm.control, name: 'message' });
    const hex = useWatch({ control: signForm.control, name: 'hex' });

    const waitForSignVerifyDevice = async () => {
        navigation.navigate(RootStackRoutes.SignVerifyStack);

        return await waitForDevice();
    };

    // Read after waiting: the device may have connected while the user was asked for it.
    const getDevice = () => selectSelectedDevice(store.getState());

    const sign = signForm.handleSubmit(async values => {
        if (!(await waitForSignVerifyDevice())) {
            return;
        }

        const result = await signMessage({
            device: getDevice(),
            path: addresses.find(({ address }) => address === values.address)?.path ?? '',
            message: values.message,
            hex: values.hex,
            format: formats?.find(({ value }) => value === values.format)?.value ?? defaultFormat,
        });
        navigation.goBack();

        if (result.success) {
            signForm.setValue('signature', result.payload.signature);
            setIsSigned(true);
        }
    });

    const verify = verifyForm.handleSubmit(async values => {
        if (verifyMessage === undefined || !(await waitForSignVerifyDevice())) {
            setVerifyOutcome(undefined);

            return;
        }

        const result = await verifyMessage({ device: getDevice(), ...values, hex: false });
        navigation.goBack();

        setVerifyOutcome(getVerifyOutcome(result));
    });

    const tabs: SubTabItem<Tab>[] = [
        { value: 'sign', label: <Translation id="signAndVerify.tabs.sign" /> },
        ...(verifyMessage
            ? [{ value: 'verify' as const, label: <Translation id="signAndVerify.tabs.verify" /> }]
            : []),
    ];

    return (
        <VStack spacing="sp16">
            <HStack alignItems="center" justifyContent="space-between">
                <SubTabs items={tabs} onChange={setActiveTab} value={activeTab} />
                {activeTab === 'sign' && isSigned && (
                    <Badge
                        icon="check"
                        label={<Translation id="signAndVerify.results.signed" />}
                        intent="brand"
                    />
                )}
                {activeTab === 'verify' && verifyOutcome === 'verified' && (
                    <Badge
                        icon="check"
                        label={<Translation id="signAndVerify.results.verified" />}
                        intent="brand"
                    />
                )}
                {activeTab === 'verify' && verifyOutcome === 'failed' && (
                    <Badge
                        icon="warningCircle"
                        label={<Translation id="signAndVerify.results.failed" />}
                        intent="critical"
                    />
                )}
            </HStack>
            {activeTab === 'sign' && (
                <SignMessageCard
                    form={signForm}
                    formats={formats && formats.length > 1 ? formats : undefined}
                    addressGroups={addressGroups}
                    hex={hex}
                    isSigned={isSigned}
                    onFormatSelect={format => signForm.setValue('format', format)}
                    onAddressSelect={address =>
                        signForm.setValue('address', address, { shouldValidate: true })
                    }
                    onHexChange={isHexOn => {
                        signForm.setValue('hex', isHexOn);
                        if (message) {
                            signForm.trigger('message');
                        }
                    }}
                    onSign={() => sign()}
                    onClear={() => {
                        signForm.reset();
                        setIsSigned(false);
                    }}
                />
            )}
            {activeTab === 'verify' && (
                <VerifyMessageCard
                    form={verifyForm}
                    isVerified={verifyOutcome === 'verified'}
                    onVerify={() => verify()}
                    onClear={() => {
                        verifyForm.reset();
                        setVerifyOutcome(undefined);
                    }}
                />
            )}
        </VStack>
    );
};
