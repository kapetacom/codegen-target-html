import Path from 'path';
import {describe, test, beforeEach, expect} from '@jest/globals';

import { CodegenHelpers, BlockCodeGenerator } from '@kapeta/codegen';
import Target from '../../src';

describe('blocks', () => {

    test('simple', async () => {
        const basedir = Path.resolve(__dirname, '../resources/examples/simple');
        const data = require('../resources/examples/simple/kapeta.yml');

        const blockCodeGenerator = new BlockCodeGenerator(data);
        blockCodeGenerator.withOption('AIContext', 'storm');
        blockCodeGenerator.withOption('AIStaticFiles', Path.resolve(__dirname, '../resources/examples/simple/public'));

        const target = new Target(blockCodeGenerator.getTargetOptions());
        const results = await blockCodeGenerator.generateForTarget(target as any);

        expect(results.files.find((generatedFile) => generatedFile.filename === 'public/index.html')).toBeDefined();
        expect(results.files.find((generatedFile) => generatedFile.filename === 'public/styles/style.css')).toBeDefined();
    });
});
