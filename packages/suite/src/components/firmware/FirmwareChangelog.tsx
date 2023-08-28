import styled from 'styled-components';

const ChangesUl = styled.ul`
    margin-left: 16px;

    > li {
        margin: 4px 0;
    }
`;

interface FirmwareChangelogProps {
    changelog: string[];
}

export const FirmwareChangelog = ({ changelog }: FirmwareChangelogProps) => (
    <ChangesUl>{changelog.map(change => change && <li key={change}>{change}</li>)}</ChangesUl>
);
