import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { useSelector } from 'src/hooks/suite/useSelector';
import { Card, Button } from '@trezor/components';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectCoinjoinAccountByKey } from 'src/reducers/wallet/coinjoinReducer';

const LargeTxInputsContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 8px;
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
`;

// const LargeTxInputs = styled.div`
//     display: flex;
//     flex-direction: row;
//     padding: 8px;
// `;

const getInternalInputs = (index: number, flag: number) => ({
    address_n: [2147493673, 2147483649, 2147483648, 2147483649, 1, index],
    // address_n: `m/10025'/1'/0'/1'/1/${index}`,
    prev_hash: 'f982c0a283bd65a59aa89eded9e48f2a3319cb80361dfab4cf6192a03badb60a',
    prev_index: 1,
    amount: 30000,
    script_type: 'SPENDTAPROOT',
    coinjoin_flags: flag,
});

const getExternalInputs = (flag: number) => ({
    amount: 30000,
    prev_hash: 'e5b7e21b5ba720e81efd6bfa9f854ababdcddc75a43bfa60bf0fe069cfd1bb8a',
    prev_index: 0,
    script_type: 'EXTERNAL',
    script_pubkey: '5120b3a2750e21facec36b2a56d76cca6019bf517a5c45e2ea8e5b4ed191090f3003',
    ownership_proof:
        '534c001901019cf1b0ad730100bd7a69e987d55348bb798e2b2096a6a5713e9517655bd2021300014052d479f48d34f1ca6872d4571413660040c3e98841ab23a2c5c1f37399b71bfa6f56364b79717ee90552076a872da68129694e1b4fb0e0651373dcf56db123c5',
    commitment_data:
        '0f7777772e6578616d706c652e636f6d0000000000000000000000000000000000000000000000000000000000000001',
    coinjoin_flags: flag,
});

const getInternalOutputs = (num: number) => {
    const outputs = [];
    for (let i = 0; i < num; i++) {
        outputs.push({
            address_n: [2147493673, 2147483649, 2147483648, 2147483649, 1, 1],
            amount: 10000,
            script_type: 'PAYTOTAPROOT',
        });
    }
    return outputs;
};

const getExternalOutputs = (num: number) => {
    const outputs = [];
    for (let i = 0; i < num; i++) {
        outputs.push({
            address: 'tb1pupzczx9cpgyqgtvycncr2mvxscl790luqd8g88qkdt2w3kn7ymhsrdueu2',
            amount: 10000,
            script_type: 'PAYTOADDRESS',
        });
    }
    return outputs;
};

interface CoinjoinSetupProps {
    account: Account;
    device: any;
}

export const CoinjoinTestLargeTx = ({ account, device }: CoinjoinSetupProps) => {
    const coinjoinAccount = useSelector(state => selectCoinjoinAccountByKey(state, account.key));

    const dispatch = useDispatch();

    // const internalInputs = useRef<HTMLInputElement | null>(null);
    // const externalInputs = useRef<HTMLInputElement | null>(null);
    // const internalOutputs = useRef<HTMLInputElement | null>(null);
    // const externalOutputs = useRef<HTMLInputElement | null>(null);

    if (!coinjoinAccount) {
        return null;
    }

    const signLargeTx = async () => {
        await TrezorConnect.cancelCoinjoinAuthorization({
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
        });

        await TrezorConnect.authorizeCoinjoin({
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
            path: account.path,
            coin: 'testnet',
            coordinator: 'www.example.com',
            maxCoordinatorFeeRate: 500000,
            maxFeePerKvbyte: 3500,
            maxRounds: 10,
        });

        const coinjoinRequest = {
            min_registrable_amount: 5000,
            mask_public_key: '030fdf5e289b5aef536290953ae81ce60e841ff956f366ac123fa69db3c79f21b0',
            signature:
                'b548e5bd30dd93061843b4a6a068f2ca61dd0574f4ba929c77e10cec47102f2051b2a61f32ec14e14855ead9686440dd9ec2b3881db70b098e7486bd55d53f74',
            fee_rate: 500000,
            no_fee_threshold: 1000000,
        };

        const flags = [
            0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        ];

        const start = Date.now();
        const signTx = await TrezorConnect.signTransaction({
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
            // @ts-expect-error TODO: tx.inputs/outputs path is a string
            inputs: flags
                .slice(0, 10)
                .map((flag, index) => getInternalInputs(index, flag))
                // @ts-expect-error TODO: tx.inputs/outputs path is a string
                .concat(flags.slice(10).map(flag => getExternalInputs(flag))),
            // @ts-expect-error TODO: tx.inputs/outputs path is a string
            outputs: getInternalOutputs(30).concat(getExternalOutputs(1170)),
            coinjoinRequest,
            coin: 'testnet',
            preauthorized: true,
            serialize: false,
            unlockPath: account.unlockPath,
            override: true, // override current call (override SUITE.LOCK)
        });
        const end = Date.now() - start;

        if (signTx.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: `SignTransaction duration ${end} ms`,
                }),
            );
        } else {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: `SignTransaction error ${signTx.payload.error}`,
                }),
            );
        }
    };

    return (
        <Card customPadding="8px">
            <LargeTxInputsContainer>
                {/* <LargeTxInputs>
                    <Input
                        label="Internal inputs"
                        variant="small"
                        defaultValue={10}
                        innerRef={internalInputs}
                    />
                    <Input
                        label="External inputs"
                        variant="small"
                        defaultValue={390}
                        innerRef={externalInputs}
                    />
                </LargeTxInputs>
                <LargeTxInputs>
                    <Input
                        label="Internal outputs"
                        variant="small"
                        defaultValue={30}
                        innerRef={internalOutputs}
                    />
                    <Input
                        label="External outputs"
                        variant="small"
                        defaultValue={1170}
                        innerRef={externalOutputs}
                    />
                </LargeTxInputs> */}
                <Button onClick={signLargeTx}>Sign large tx</Button>
            </LargeTxInputsContainer>
        </Card>
    );
};
