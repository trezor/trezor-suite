import { ReactNode } from 'react';
import styled from 'styled-components';
import { useDiscovery, useLayout } from 'src/hooks/suite';
import { SettingsMenu } from './SettingsMenu';
import { SettingsLoading } from 'src/views/settings/SettingsLoader';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    margin-top: 8px;
`;

type SettingsLayoutProps = {
    title?: string;
    children?: ReactNode;
    ['data-test-id']?: string;
    className?: string;
};

export const SettingsLayout = ({
    title,
    children,
    className,
    'data-test-id': dataTest,
}: SettingsLayoutProps) => {
    useLayout(title || 'Settings', SettingsMenu);
    const { isDiscoveryRunning } = useDiscovery();

    return (
        <Wrapper className={className} data-test-id={dataTest}>
            <SettingsLoading isPresent={isDiscoveryRunning} />
            <>{children}</>
        </Wrapper>
    );
};
