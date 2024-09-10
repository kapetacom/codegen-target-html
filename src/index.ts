/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import { format, Target } from '@kapeta/codegen-target';
import type { GeneratedAsset, SourceFile, GeneratedFile } from '@kapeta/codegen-target';
import Path from 'path';
import { exec } from '@kapeta/nodejs-process';
import { mergePackageJson } from './target/merge-package';
import { mergeDevcontainers } from './target/merge-devcontainers';
import { CodegenHelpers } from '@kapeta/codegen';
import * as fs from "node:fs";
import path from "node:path";

interface Options {
    AIContext?: string;
    AIStaticFiles?: string;
}

export default class HtmlTarget extends Target {
    constructor(options: any) {
        super(options, Path.resolve(__dirname, '../'));
    }

    mergeFile(sourceFile: SourceFile, newFile: GeneratedFile, lastFile: GeneratedFile): GeneratedFile {
        if (sourceFile.filename === 'package.json') {
            return mergePackageJson(sourceFile, newFile, lastFile);
        }

        if (sourceFile.filename === '.devcontainer/devcontainer.json') {
            return mergeDevcontainers(sourceFile, newFile, lastFile);
        }

        return super.mergeFile(sourceFile, newFile, lastFile);
    }

    protected _createTemplateEngine(data: any, context: any) {
        return super._createTemplateEngine(data, context);
    }

    protected _postProcessCode(filename: string, code: string) {
        return format(filename, code);
    }

    generate(data: any, context: any): GeneratedFile[] {
        const result = super.generate(data, context);
        const targetOptions = this.options as Options;

        if (targetOptions.AIContext && targetOptions.AIStaticFiles) {
            const staticFiles = CodegenHelpers.walkDirectory(targetOptions.AIStaticFiles);
            staticFiles.forEach((staticFile) => {
                const stats = fs.statSync(staticFile);
                const content = fs.readFileSync(staticFile);

                result.push({
                    filename: 'public/' + path.relative(targetOptions.AIStaticFiles!, staticFile),
                    content: content,
                    mode: stats.mode.toString(8),
                    permissions: (stats.mode & 0o777).toString(8)
                });
            });
        }

        return result;
    }

    async postprocess(targetDir: string, files: GeneratedAsset[]): Promise<void> {
        const packageJsonChanged = files.some((file) => file.filename === 'package.json');

        if (packageJsonChanged) {
            console.log('Running npm install in %s', targetDir);
            const child = exec('npm install', {
                cwd: targetDir,
            });

            await child.wait();

            console.log('install done');
        }
    }
}
