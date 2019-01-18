import React from 'react';
import { setAddon, storiesOf } from '@storybook/react';
import { action, actions, configureActions } from '@storybook/addon-actions';

import ICONS from 'config/icons';
import * as MODAL from '/actions/constants/modal';
import * as RECEIVE from 'actions/constants/receive';
import * as CONNECT from 'actions/constants/TrezorConnect';
import { UI } from 'trezor-connect';

import JSXAddon from 'storybook-addon-jsx';
import ButtonText from 'components/buttons/ButtonText';
import ButtonWebUSB from 'components/buttons/ButtonWebUSB';
import Icon from 'components/Icon';
import TransactionItem from 'components/Transaction';
import Modal from 'components/modals';

const device = {
    label: 'Test',
    path: 'test',
};

setAddon(JSXAddon);

storiesOf('Buttons', module)
    .addWithJSX('with text', () => <ButtonText>Hello Button</ButtonText>)
    .addWithJSX('with text (disabled)', () => (
        <ButtonText isDisabled>Hello Button</ButtonText>
    ))
    .addWithJSX('transparent with text ', () => (
        <ButtonText isTransparent>Hello Button</ButtonText>
    ))
    .addWithJSX('with text (WebUSB)', () => (
        <ButtonWebUSB>Hello Button</ButtonWebUSB>
    ));

storiesOf('Modal', module)
    .addWithJSX('Enter pin', () => (
        <Modal
            modal={{
                device,
                context: MODAL.CONTEXT_DEVICE,
                windowType: UI.REQUEST_PIN,
            }}
            modalActions={{
                onPinSubmit: action('onPinSubmit'),
            }}
        />
    ))
    .addWithJSX('Request passphrase', () => (
        <Modal
            modal={{
                device,
                context: MODAL.CONTEXT_DEVICE,
                windowType: UI.REQUEST_PASSPHRASE,
            }}
            wallet={{
                selectedDevice: device,
            }}
            modalActions={{
                onPassphraseSubmit: action('onPassphraseSubmit'),
            }}
        />
    ))
    .addWithJSX('Request passphrase type', () => (
        <Modal
            modal={{
                device,
                context: MODAL.CONTEXT_DEVICE,
                windowType: 'ButtonRequest_PassphraseType',
            }}
        />
    ))
    .addWithJSX('Sign TX Ethereum', () => (
        <Modal
            selectedAccount={{
                network: {
                    type: 'ethereum',
                },
            }}
            sendFormEthereum={{
                amount: 100,
                currency: 'BTC',
                address: 'testaddress',
                selectedFeeLevel: {
                    value: 10,
                },
            }}
            modal={{
                device,
                context: MODAL.CONTEXT_DEVICE,
                windowType: 'ButtonRequest_SignTx',
            }}
        />
    ))
    .addWithJSX('Sign TX Ripple', () => (
        <Modal
            selectedAccount={{
                network: {
                    type: 'ripple',
                },
            }}
            sendFormRipple={{
                amount: 100,
                currency: 'BTC',
                address: 'testaddress',
                selectedFeeLevel: {
                    value: 10,
                },
            }}
            modal={{
                device,
                context: MODAL.CONTEXT_DEVICE,
                windowType: 'ButtonRequest_SignTx',
            }}
        />
    ))
    .addWithJSX('Confirm action', () => (
        <Modal
            modal={{
                device,
                context: MODAL.CONTEXT_DEVICE,
                windowType: 'ButtonRequest_ProtectCall',
            }}
        />
    ))
    .addWithJSX('Confirm unverified address', () => (
        <Modal
            selectedAccount={{
                account: {
                    accountPath: 'test',
                },
            }}
            modalActions={{
                onCancel: action('onCancel', event),
            }}
            receiveActions={{
                showAddress: action('showAddress'),
                showUnverifiedAddress: action('showUnverifiedAddress'),
            }}
            modal={{
                device,
                context: MODAL.CONTEXT_DEVICE,
                windowType: RECEIVE.REQUEST_UNVERIFIED,
            }}
        />
    ))
    .addWithJSX('Remember device', () => (
        <Modal
            modalActions={{
                onRememberDevice: action('onRememberDevice'),
                onForgetDevice: action('onForgetDevice'),
            }}
            modal={{
                device,
                instances: [
                    {
                        instanceLabel: 'test',
                    },
                ],
                context: MODAL.CONTEXT_DEVICE,
                windowType: CONNECT.REMEMBER_REQUEST,
            }}
        />
    ))
    .addWithJSX('Forget device', () => (
        <Modal
            modalActions={{
                onForgetSingleDevice: action('onForgetSingleDevice'),
                onCancel: action('onCancel'),
            }}
            modal={{
                device,
                context: MODAL.CONTEXT_DEVICE,
                windowType: CONNECT.FORGET_REQUEST,
            }}
        />
    ))
    .addWithJSX('Try to duplicate', () => (
        <Modal
            modalActions={{
                onDuplicateDevice: action('onDuplicateDevice'),
                onCancel: action('onCancel'),
            }}
            devices={[device]}
            modal={{
                device,
                context: MODAL.CONTEXT_DEVICE,
                windowType: CONNECT.TRY_TO_DUPLICATE,
            }}
        />
    ))
    .addWithJSX('Request wallet type', () => (
        <Modal
            modalActions={{
                onWalletTypeRequest: action('onWalletTypeRequest'),
                onCancel: action('onCancel'),
            }}
            modal={{
                device,
                context: MODAL.CONTEXT_DEVICE,
                windowType: CONNECT.REQUEST_WALLET_TYPE,
            }}
        />
    ))
    .addWithJSX('Invalid pin', () => (
        <Modal
            modal={{
                device,
                context: MODAL.CONTEXT_DEVICE,
                windowType: UI.INVALID_PIN,
            }}
        />
    ));

storiesOf('Transaction', module).addWithJSX('with text', () => (
    <TransactionItem />
));

storiesOf('Icon', module)
    .addWithJSX('Top', () => <Icon icon={ICONS.TOP} />)
    .addWithJSX('Eye crossed', () => <Icon icon={ICONS.EYE_CROSSED} />)
    .addWithJSX('Eye', () => <Icon icon={ICONS.EYE} />)
    .addWithJSX('Checked', () => <Icon icon={ICONS.CHECKED} />)
    .addWithJSX('Back', () => <Icon icon={ICONS.BACK} />)
    .addWithJSX('Help', () => <Icon icon={ICONS.HELP} />)
    .addWithJSX('Refresh', () => <Icon icon={ICONS.REFRESH} />)
    .addWithJSX('T1', () => <Icon icon={ICONS.T1} />)
    .addWithJSX('Config', () => <Icon icon={ICONS.COG} />)
    .addWithJSX('Eject', () => <Icon icon={ICONS.EJECT} />)
    .addWithJSX('Close', () => <Icon icon={ICONS.CLOSE} />)
    .addWithJSX('Download', () => <Icon icon={ICONS.DOWNLOAD} />)
    .addWithJSX('Plus', () => <Icon icon={ICONS.PLUS} />)
    .addWithJSX('Arrow up', () => <Icon icon={ICONS.ARROW_UP} />)
    .addWithJSX('Arrow left', () => <Icon icon={ICONS.ARROW_LEFT} />)
    .addWithJSX('Arrow down', () => <Icon icon={ICONS.ARROW_DOWN} />)
    .addWithJSX('Chat', () => <Icon icon={ICONS.CHAT} />)
    .addWithJSX('Skip', () => <Icon icon={ICONS.SKIP} />)
    .addWithJSX('Warning', () => <Icon icon={ICONS.WARNING} />)
    .addWithJSX('Info', () => <Icon icon={ICONS.INFO} />)
    .addWithJSX('Error', () => <Icon icon={ICONS.ERROR} />)
    .addWithJSX('Success', () => <Icon icon={ICONS.SUCCESS} />);
