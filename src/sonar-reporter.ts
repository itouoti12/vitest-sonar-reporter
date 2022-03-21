import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'pathe';

import type { File, Reporter, Vitest } from './types';

export default class SonarReporter implements Reporter {
    ctx!: Vitest;

    onInit(ctx: Vitest) {
        this.ctx = ctx;

        if (!this.ctx.config.outputFile) {
            throw new Error(
                'SonarReporter requires config.outputFile to be defined in vite config'
            );
        }

        if (existsSync(this.ctx.config.outputFile)) {
            rmSync(this.ctx.config.outputFile);
        }
    }

    onFinished(files?: File[]) {
        const reportFile = resolve(
            this.ctx.config.root,
            this.ctx.config.outputFile
        );

        const outputDirectory = dirname(reportFile);
        if (!existsSync(outputDirectory)) {
            mkdirSync(outputDirectory, { recursive: true });
        }

        writeFileSync(reportFile, generateXml(files), 'utf-8');
        this.ctx.log(`SonarQube report written to ${reportFile}`);
    }
}

function generateXml(files?: File[]) {
    // prettier-ignore
    return `
<testExecutions version="1">
    ${files?.map((file) => `
    <file path="${file.name}">
    </file>`.trim())}
</testExecutions>
    `.trim();
}
