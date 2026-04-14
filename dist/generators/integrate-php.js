import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = resolve(__dirname, '../../templates/integrate.php.tpl');
export function generateIntegratePhp(prefix) {
    const template = readFileSync(TEMPLATE_PATH, 'utf-8');
    return template.replace(/theme\.json/g, `theme-${prefix}.json`);
}
//# sourceMappingURL=integrate-php.js.map