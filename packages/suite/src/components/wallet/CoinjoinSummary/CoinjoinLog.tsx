import React, { createRef } from 'react';
import styled from 'styled-components';
import { Button, CollapsibleBox } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { Translation } from '@suite-components';
import { useSelector } from '@suite-hooks';

const LogWrapper = styled.div`
    margin: 10px 0px;
    max-height: 250px;
    overflow: auto;
`;

const ActionsWrapper = styled.div`
    display: flex;
    flex-direction: row;
    padding-bottom: 6px;
`;

const LogRow = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding-bottom: 6px;
`;

export const CoinjoinLog = () => {
    const htmlElement = createRef<HTMLDivElement>();
    const log = useSelector(state => state.wallet.coinjoin.log);
    const copy = () => {
        copyToClipboard(JSON.stringify(log), htmlElement.current);
    };
    const download = () => {
        const element = document.createElement('a');
        element.setAttribute(
            'href',
            `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(log))}`,
        );
        element.setAttribute('download', 'coinjoin-log.txt');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };
    return (
        <CollapsibleBox opened={false} heading="Log" variant="small">
            <ActionsWrapper ref={htmlElement}>
                <Button variant="tertiary" onClick={download}>
                    <Translation id="TR_EXPORT_TO_FILE" />
                </Button>
                <Button variant="tertiary" onClick={copy}>
                    <Translation id="TR_COPY_TO_CLIPBOARD" />
                </Button>
            </ActionsWrapper>
            <LogWrapper>
                {log.map((l, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <LogRow key={l.time + l.value + i}>
                        {l.time} {l.value}
                    </LogRow>
                ))}
            </LogWrapper>
        </CollapsibleBox>
    );
};
