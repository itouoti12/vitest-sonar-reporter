import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'pathe';
import type { Reporter, File, Vitest } from 'vitest';

import { generateXml } from './xml.js';

/**
 * Define this reporter in your `vite.config.ts`:
 *
 * ```ts
 * import { defineConfig } from 'vitest/config';
 * import SonarReporter from 'vitest-sonar-reporter';
 *
 * export default defineConfig({
 *     test: {
 *         reporters: new SonarReporter(),
 *         outputFile: 'sonar-report.xml',
 *     },
 * });
 * ```
 *
 */
export default class SonarReporter implements Reporter {
    ctx!: Vitest;
    outputFile!: string;

    onInit(ctx: Vitest) {
        this.ctx = ctx;

        if (!this.ctx.config.outputFile) {
            throw new Error(
                'SonarReporter requires config.outputFile to be defined in vite config'
            );
        }

        this.outputFile = resolveOutputfile(this.ctx.config);

        if (existsSync(this.outputFile)) {
            rmSync(this.outputFile);
        }
    }

    onFinished(files?: File[]) {
        const reportFile = resolve(this.ctx.config.root, this.outputFile);

        const outputDirectory = dirname(reportFile);
        if (!existsSync(outputDirectory)) {
            mkdirSync(outputDirectory, { recursive: true });
        }

        writeFileSync(reportFile, generateXml(files), 'utf-8');
        this.ctx.log(`SonarQube report written to ${reportFile}`);
    }
}

function resolveOutputfile(config: Vitest['config']) {
    if (typeof config.outputFile === 'string') {
        return config.outputFile;
    }

    if (config.outputFile['vitest-sonar-reporter']) {
        return config.outputFile['vitest-sonar-reporter'];
    }

    throw new Error(
        [
            'Unable to resolve outputFile for vitest-sonar-reporter.',
            'Define outputFile as string or add entry for it:',
            JSON.stringify(
                {
                    test: {
                        outputFile: {
                            'vitest-sonar-reporter': 'sonar-report.xml',
                        },
                    },
                },
                null,
                2
            ),
        ].join('\n')
    );
}
