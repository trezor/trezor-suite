import { ReactNode } from 'react';

import styled from 'styled-components';

const Aside = styled.aside`
    display: flex;
    flex-flow: column;
    height: 100%;
    border-right: 1px solid #e3e3e3;
    background-color: #f9f9f9;
    width: 35vw;

    @media (max-width: 639px) {
        width: 100vw;
        justify-content: space-between;
        height: auto;
    }
`;

const MainSlot = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 24px;

    @media (max-width: 639px) {
        flex-direction: row;
        padding: 12px;
    }
`;

const Header = styled.div`
    @media (max-width: 639px) {
        display: flex;
        align-items: center;
    }
`;

const Info = styled.div`
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    word-break: break-word;

    @media (max-width: 639px) {
        font-size: 80%;
        align-items: flex-end;
    }
`;

const MethodName = styled.h2`
    @media (max-width: 639px) {
        margin: 0 0 4px;
    }
`;

const Origin = styled.p`
    @media (max-width: 639px) {
        margin: 0;
    }
`;

interface InfoPanelProps {
    method?: string;
    origin?: string;
    hostLabel?: string;
    topSlot?: ReactNode;
}

export const InfoPanel = ({ method, origin, hostLabel, topSlot }: InfoPanelProps) => (
    <>
        <Aside data-test-id="@info-panel">
            {/*  notifications appear hear */}
            {topSlot && topSlot}

            <MainSlot>
                <Header>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        x="0px"
                        y="0px"
                        viewBox="0 0 163.7 41.9"
                        width="94.5px"
                        height="24px"
                        preserveAspectRatio="xMinYMin meet"
                    >
                        <polygon points="101.1,12.8 118.2,12.8 118.2,17.3 108.9,29.9 118.2,29.9 118.2,35.2 101.1,35.2 101.1,30.7 110.4,18.1 101.1,18.1" />
                        <path d="M158.8,26.9c2.1-0.8,4.3-2.9,4.3-6.6c0-4.5-3.1-7.4-7.7-7.4h-10.5v22.3h5.8v-7.5h2.2l4.1,7.5h6.7L158.8,26.9z M154.7,22.5 h-4V18h4c1.5,0,2.5,0.9,2.5,2.2C157.2,21.6,156.2,22.5,154.7,22.5z" />
                        <path d="M130.8,12.5c-6.8,0-11.6,4.9-11.6,11.5s4.9,11.5,11.6,11.5s11.7-4.9,11.7-11.5S137.6,12.5,130.8,12.5z M130.8,30.3 c-3.4,0-5.7-2.6-5.7-6.3c0-3.8,2.3-6.3,5.7-6.3c3.4,0,5.8,2.6,5.8,6.3C136.6,27.7,134.2,30.3,130.8,30.3z" />
                        <polygon points="82.1,12.8 98.3,12.8 98.3,18 87.9,18 87.9,21.3 98,21.3 98,26.4 87.9,26.4 87.9,30 98.3,30 98.3,35.2 82.1,35.2 " />
                        <path d="M24.6,9.7C24.6,4.4,20,0,14.4,0S4.2,4.4,4.2,9.7v3.1H0v22.3h0l14.4,6.7l14.4-6.7h0V12.9h-4.2V9.7z M9.4,9.7 c0-2.5,2.2-4.5,5-4.5s5,2,5,4.5v3.1H9.4V9.7z M23,31.5l-8.6,4l-8.6-4V18.1H23V31.5z" />
                        <path d="M79.4,20.3c0-4.5-3.1-7.4-7.7-7.4H61.2v22.3H67v-7.5h2.2l4.1,7.5H80l-4.9-8.3C77.2,26.1,79.4,24,79.4,20.3z M71,22.5h-4V18 h4c1.5,0,2.5,0.9,2.5,2.2C73.5,21.6,72.5,22.5,71,22.5z" />
                        <polygon points="40.5,12.8 58.6,12.8 58.6,18.1 52.4,18.1 52.4,35.2 46.6,35.2 46.6,18.1 40.5,18.1 " />
                    </svg>
                </Header>
                <Info>
                    <MethodName>{method}</MethodName>
                    <Origin>{hostLabel || origin}</Origin>
                </Info>
            </MainSlot>
        </Aside>
    </>
);
