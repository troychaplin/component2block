import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = resolve(__dirname, '../../templates/integrate.php.tpl');
export function generateIntegratePhp() {
    return readFileSync(TEMPLATE_PATH, 'utf-8');
}
//# sourceMappingURL=integrate-php.js.map