import 'dotenv/config';
import { Octokit } from 'octokit';
import chalk from 'chalk';

if (!process.env.GH_TOKEN) {
    console.log(chalk.red.bold('Missing GH_TOKEN env variable.'));
    console.log(
        chalk.red(
            'Please create a personal access token at https://github.com/settings/tokens and create a .env file with GH_TOKEN=your_token',
        ),
    );

    process.exit(1);
}

const GH_TOKEN = process.env.GH_TOKEN!;

// Workflow ID is the name of the workflow file in the .github/workflows directory
const VALIDATION_WORKFLOW_ID = 'validation.yml';

// Number of workflow runs to analyze, should be a multiple of 100
const NUMBER_OF_WORFLOW_RUNS_TO_ANALYZE = 500;

// Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
const octokit = new Octokit({ auth: GH_TOKEN });

type Run = {
    id: number;
    name: string | null | undefined;
    created_at: string;
    time: number;
    timeInMinutes: string;
};

async function getValidationCheckRuns({ pagesToFetch }: { pagesToFetch: number }): Promise<Run[]> {
    if (pagesToFetch < 1) {
        return [];
    }

    try {
        const response = await octokit.request(
            'GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs',
            {
                owner: 'trezor',
                repo: 'trezor-suite',
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28',
                },
                status: 'success',
                page: pagesToFetch,
                per_page: 100,
                workflow_id: VALIDATION_WORKFLOW_ID,
            },
        );

        const runs: Run[] = response.data.workflow_runs.map(run => ({
            id: run.id,
            name: run.name,
            created_at: run.created_at,
            time:
                (new Date(run.updated_at).getTime() - new Date(run.run_started_at!).getTime()) /
                1000,
            timeInMinutes: (
                (new Date(run.updated_at).getTime() - new Date(run.run_started_at!).getTime()) /
                1000 /
                60
            ).toFixed(2),
        }));

        return [...runs, ...(await getValidationCheckRuns({ pagesToFetch: pagesToFetch - 1 }))];
    } catch (error) {
        console.error(chalk.red('Error fetching validation check runs'), error);
        return [];
    }
}

const pagesToFetch = Math.ceil(NUMBER_OF_WORFLOW_RUNS_TO_ANALYZE / 100);
const validationCheckRuns = await getValidationCheckRuns({ pagesToFetch });

console.log(
    'Number of successful %s runs: %d, average time: %d minutes',
    VALIDATION_WORKFLOW_ID,
    validationCheckRuns.length,
    (
        validationCheckRuns.reduce((acc, run) => acc + parseFloat(run.timeInMinutes), 0) /
        validationCheckRuns.length
    ).toFixed(2),
);

const sortedTimes = validationCheckRuns.map(run => run.time).sort((a: number, b: number) => a - b);

// Slowest time of validation check runs
const p100Time = sortedTimes[sortedTimes.length - 1];
console.log('Slowest time: %d minutes (%d seconds total)', (p100Time / 60).toFixed(2), p100Time);

const P = [0.99, 0.98, 0.95, 0.9];

P.forEach(p => {
    const index = Math.floor(sortedTimes.length * p);
    const time = sortedTimes[index];
    console.log(
        'P%d time (%d runs): %d minutes (%d seconds total)',
        p * 100,
        index,
        (time / 60).toFixed(2),
        time,
    );
});

// Fastest time of validation check runs
const p0Time = sortedTimes[0];
console.log('Fastest time: %d minutes (%d seconds total)', (p0Time / 60).toFixed(2), p0Time);

// Oldest time of validation check runs
const sortedRuns = validationCheckRuns.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
);
console.log(
    'Oldest run in this batch: %s',
    new Date(sortedRuns[0].created_at).toLocaleString('en-US', {
        timeZone: 'UTC',
    }),
);
