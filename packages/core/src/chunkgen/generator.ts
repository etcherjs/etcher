import { Chunk } from '../types';

export const generateChunkFunction = (chunk: Chunk): string => {
    console.log(chunk.data);
    console.log(chunk.data.replaceAll('\n', '\\n'));

    return `export default function ${chunk.name.replace(' ', '_')}() {
    window.etcher.transform(\`${chunk.data.replaceAll('\n', '\\n')}\`, '${chunk.chunkName}');
}
    
//# sourceURL=${chunk.name}.xtml`;
};

export const generateChunkImport = (chunk: Chunk): string => {
    return `<script type="module">
import ${chunk.name.replace('', '_')} from '/@etcher/${chunk.chunkName}.js';

${chunk.name.replace('', '_')}();
</script></body>`;
};
