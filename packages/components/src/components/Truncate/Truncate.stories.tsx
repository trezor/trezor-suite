import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';

import { Truncate as TruncateComponent, TruncateProps } from './Truncate';

const Holder = styled.div`
    display: flex;
    justify-content: center;
    width: 300px;
    padding: 100px 0px;
`;

export default {
    title: 'Misc/Truncate',
} as Meta;

export const Truncate: StoryObj<TruncateProps> = {
    render: ({ ...args }) => (
        <>
            <Holder>
                <TruncateComponent lines={args.lines}>We were a small team.</TruncateComponent>
            </Holder>
            <Holder>
                <TruncateComponent lines={args.lines}>
                    But now, our team consists of many developers. Matej Kriz, Martin Varmuza,
                    Carlos, Leonid, Tomas Klima, Jan Komarek, Marek Polak, Dan, Bohdan and Honza.
                </TruncateComponent>
            </Holder>
        </>
    ),
    args: {
        lines: 1,
    },
};
