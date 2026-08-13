/**
 * Prints the catalog document exactly as the agent receives it.
 *
 * Useful when tuning the prompt, and as a diff target in review: a change to
 * the design system that widens or narrows what the agent may render shows up
 * here.
 *
 *   npm run catalog:print
 *   npm run catalog:print > catalog.json
 */

import { buildCatalogDocument } from '../src/a2ui/catalog/define';
import { designSystemCatalog } from '../src/a2ui/catalog/design-system';

process.stdout.write(`${JSON.stringify(buildCatalogDocument(designSystemCatalog), null, 2)}\n`);
