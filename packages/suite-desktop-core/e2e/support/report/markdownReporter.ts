import { FullConfig, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import fs from 'fs';

class MarkdownReporter implements Reporter {
    private results: string[] = [];

    onBegin(config: FullConfig, suite: Suite) {
        this.results.push(`# Test Report - ${new Date().toLocaleString()}\n`);
    }

    onTestEnd(test: TestCase, result: TestResult) {
        const statusEmoji = {
            passed: '✅',
            failed: '❌',
            skipped: '⚠️',
            timedOut: '⏳',
            interrupted: '🚫',
        };

        const annotations = test.annotations
            .map(a => `- **${a.type}**: ${a.description || ''}`)
            .join('\n');

        this.results.push(`### ${statusEmoji[result.status]} ${test.title}`);
        this.results.push(`- **Status**: ${result.status}`);
        this.results.push(`- **Duration**: ${result.duration}ms`);
        if (annotations) {
            this.results.push(`- **Annotations**:\n${annotations}`);
        }
        if (result.error) {
            this.results.push(`\n\`\`\`\n${result.error.message}\n\`\`\``);
        }
        this.results.push('\n---\n');
    }

    onEnd() {
        const markdownReport = this.results.join('\n');
        fs.writeFileSync('test-report.md', markdownReport);
    }
}

export { MarkdownReporter };
