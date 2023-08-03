import React from 'react';
import styled from 'styled-components';

import { Truncate } from './index';

const Holder = styled.div`
    display: flex;
    justify-content: center;
    width: 300px;
    padding: 100px 0px;
`;

export default {
    title: 'Misc/Truncate',
    args: {
        numberOfLines: 1,
        shortText: 'We were a small team.',
        longText:
            'But now, our team consists of many developers. Matej Kriz, Martin Varmuza, Carlos, Leonid, Tomas Klima, Jan Komarek, Marek Polak, Dan, Bohdan and Honza.',
    },
};

export const Basic = {
    render: ({ ...args }) => (
        <>
            <Holder>
                <Truncate lines={args.numberOfLines}>{args.shortText}</Truncate>
            </Holder>
            <Holder>
                <Truncate lines={args.numberOfLines}>{args.longText}</Truncate>
            </Holder>
        </>
    ),
};
