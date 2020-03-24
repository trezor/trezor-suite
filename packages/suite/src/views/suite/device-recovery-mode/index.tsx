import React from 'react';
import TrezorConnect from 'trezor-connect';
import { H2, P, Button } from '@trezor/components';
import { Loading } from '@suite-components';

import { Props } from './Container';

const Index = ({ locks, recoverDevice, checkSeed }: Props) => (
    <>
        {locks.length > 0 && <Loading />}
        {locks.length === 0 && (
            <>
                <H2>Your device is in recovery mode.</H2>
                <P>Finish recovery on device screen or cancel it</P>
                <Button onClick={() => checkSeed()}>check seed</Button>
            </>
        )}
    </>
);

export default Index;
