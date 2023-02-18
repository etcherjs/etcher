import { CompletionHandler, CompletionResolveHandler } from './Completion';
import DefinitionHandler from './Definition';
import ValidateHandler from './Validate';
import HoverHandler from './Hover';

export default {
    Validate: ValidateHandler,
    Definition: DefinitionHandler,
    Hover: HoverHandler,
    Completion: CompletionHandler,
    CompletionResolve: CompletionResolveHandler,
};
