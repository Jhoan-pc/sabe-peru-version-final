/**
 * OpenAPI 3.1 Spec Parser and Contract Inspector
 * Formal SSOT: specs/openapi.yaml
 */
import fs from 'node:fs';
import path from 'node:path';

export function loadOpenApiSpec(projectRoot = process.cwd()) {
  const specPath = path.resolve(projectRoot, 'specs', 'openapi.yaml');
  if (!fs.existsSync(specPath)) {
    throw new Error(`OpenAPI spec not found at: ${specPath}`);
  }
  const content = fs.readFileSync(specPath, 'utf8');
  return {
    raw: content,
    extractAllergenEnum() {
      const startIdx = content.indexOf('AllergenTag:');
      if (startIdx === -1) return [];
      const slice = content.substring(startIdx);
      const endIdx = slice.indexOf('SiteContentItem:');
      const section = endIdx !== -1 ? slice.substring(0, endIdx) : slice;
      const lines = section.split('\n');
      return lines
        .map(l => l.trim())
        .filter(l => l.startsWith('- '))
        .map(l => l.substring(2).trim());
    },
    extractPaths() {
      const pathMatches = content.match(/^  (\/[a-zA-Z0-9_\-\/{}]*):/gm) || [];
      return pathMatches.map(p => p.trim().replace(/:$/, ''));
    },
    extractSchemaNames() {
      const schemaMatches = content.match(/^    ([A-Za-z0-9_-]+):/gm) || [];
      return schemaMatches.map(s => s.trim().replace(/:$/, ''));
    }
  };
}
