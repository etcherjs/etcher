import { getExported, compileToAST } from '../compiler';
import { Chunk } from '../types';

export const generateChunkFunction = (chunk: Chunk): string => {
    const parsed = compileToAST(chunk.data);

    const exportJS = getExported(chunk.chunkName, parsed.ast, parsed.findTextContent('script').join('\n'));

    return `${exportJS}\n\n//# sourceURL=${chunk.name}.xtml`;
};

export const generateChunkImport = (chunk: Chunk): string => {
    return `<script type="module">
import ${chunk.name.replace(/\W/g, '_')} from '/@etcher/${chunk.chunkName}.js';

${chunk.name.replace(/\W/g, '_')}();
</script></body>`;
};
