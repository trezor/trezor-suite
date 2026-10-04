import { Banner, Button, Card, Column, H2, Paragraph } from '@trezor/components';

import type { PreflightIssue } from '../../app/migrationState';
import { describePreflightIssue } from '../messages';

type PreflightStepProps = {
    issue?: PreflightIssue;
    isChecking: boolean;
    onRetry: () => void;
};

const isRetryable = (issue: PreflightIssue) =>
    issue.type !== 'unsupported-os' && issue.type !== 'unsupported-browser';

export const PreflightStep = ({ issue, isChecking, onRetry }: PreflightStepProps) => (
    <Card>
        <Column gap={16} alignItems="flex-start">
            <H2>Checking your computer</H2>
            {issue ? (
                <Banner intent="critical" description={describePreflightIssue(issue)} />
            ) : (
                <Paragraph>
                    Looking for Trezor Suite on this computer. Your browser may ask whether this
                    page may access devices on your local network. Choose Allow.
                </Paragraph>
            )}
            {(!issue || isRetryable(issue)) && (
                <Button isLoading={isChecking} onClick={onRetry}>
                    Check again
                </Button>
            )}
        </Column>
    </Card>
);
