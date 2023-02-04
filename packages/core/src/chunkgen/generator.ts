import { Chunk } from '../types';

export const generateChunkFunction = (chunk: Chunk): string => {
    return `export default function ${chunk.name.replace(/\W/g, '_')}() {
    window.etcher.transform(\`${chunk.data.replaceAll('\n', '\\n')}\`, '${chunk.chunkName}');
}
    
//# sourceURL=${chunk.name}.xtml`;
};

export const generateChunkImport = (chunk: Chunk): string => {
    return `<script type="module">
import ${chunk.name.replace(/\W/g, '_')} from '/@etcher/${chunk.chunkName}.js';

${chunk.name.replace(/\W/g, '_')}();
</script></body>`;
};
