// Consumer contract: the information each mission's published boundaries say it works with must
// be representable in the latest manifest schema and readable from exchanged manifests through
// one generic accessor, with no capability-specific or source-specific transformation. Needs
// that are not represented yet are listed as gaps (docs/mission-boundaries.md section 5).

import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { buildExchangeDocument } from '../src/exchange.js';
import { schemaAt } from '../src/schema-registry.js';
import { getRegistry, validateFiles } from '../src/validator.js';

// Mission -> documented need -> manifest fields (paths; [] marks list items).
const NEEDS = {
  'Mission 1 (Recommendation)': {
    'match needs against capabilities': ['description', 'supportedUseCases[].title', 'capabilityType', 'interfaces[].type', 'platformCompatibility[]'],
    'rank by risk and cost where data is available': ['riskTier', 'assessmentReference.id', 'costInformation.model'],
    'judge feasibility and constraints': ['maturity', 'lifecycleStatus', 'limitations[]', 'dependencies[].id', 'platformCompatibility[]', 'runtime[].kind', 'setup[].name', 'license.expression'],
    'explain recommendations and alternatives': ['description', 'supportedUseCases[].description', 'limitations[]', 'deprecation.replacedBy'],
  },
  'Mission 2 (Landscape)': {
    'track maturity, availability, use cases, limitations': ['maturity', 'lifecycleStatus', 'supportedUseCases[].title', 'limitations[]'],
    'problem solved and intended audience': ['description', 'intendedAudience[]'],
    'catalogue capabilities, tools, frameworks, platforms': ['id', 'name', 'capabilityType', 'source.type', 'owner.affiliation'],
    'recognise one capability across sources': ['publications[].locator', 'publications[].nativeVersion', 'source.repositoryId', 'relations[].type'],
  },
  'Mission 3 (Trust)': {
    'risk classification and its assessment record': ['riskTier', 'assessmentReference.id', 'assessmentReference.assessedOn'],
    'lifecycle expectations up to retirement': ['lifecycleStatus', 'deprecation.reason', 'deprecation.sunsetDate'],
    'third-party dependencies (partial)': ['owner.affiliation', 'source.type', 'dependencies[].id', 'license.expression', 'license.scope'],
  },
  'Mission 5 (Contribution)': {
    'contributor and maintainer responsibilities': ['owner.name', 'owner.contact'],
    'review and improvement of revisions': ['capabilityVersion', 'lastUpdated', 'schemaVersion', 'provenance[].method', 'provenance[].confirmedBy'],
  },
};

// Documented needs that the schema deliberately does not represent yet, because the owning
// mission defines the criteria first (docs/mission-boundaries.md).
const GAPS = {
  'Mission 3 (Trust)': ['dataHandling', 'accessControls', 'models'],
};

const toTokens = (path) => path.split('.').flatMap((part) => (part.endsWith('[]') ? [part.slice(0, -2), '0'] : [part]));

// The one accessor every consumer uses: a field path, whatever the capability type or source.
function read(manifest, path) {
  return path.split('.').reduce((values, part) => {
    const key = part.replace(/\[\]$/, '');
    const next = values.map((value) => value?.[key]).filter((value) => value !== undefined);
    return part.endsWith('[]') ? next.flat() : next;
  }, [manifest]);
}

describe('consumer contract: documented information needs', () => {
  const latest = getRegistry().get(getRegistry().latest).schema;
  let capabilities;
  before(async () => {
    const report = await validateFiles(['examples/valid']);
    capabilities = buildExchangeDocument(report).capabilities.map(({ manifest }) => manifest);
  });

  for (const [mission, needs] of Object.entries(NEEDS)) {
    for (const [need, fields] of Object.entries(needs)) {
      it(`${mission}: ${need} is representable in schema ${getRegistry().latest}`, () => {
        for (const field of fields) assert.ok(schemaAt(latest, toTokens(field)), `${field} is not defined`);
      });
    }
  }

  it('reads every need from every capability type through the same accessor', () => {
    const allFields = [...new Set(Object.values(NEEDS).flatMap((needs) => Object.values(needs).flat()))];
    assert.ok(new Set(capabilities.map((manifest) => manifest.capabilityType)).size >= 5);
    for (const manifest of capabilities) {
      for (const field of allFields) assert.doesNotThrow(() => read(manifest, field), `${manifest.id}: ${field}`);
      for (const mandatory of ['id', 'name', 'capabilityType', 'riskTier', 'source.type']) {
        assert.equal(read(manifest, mandatory).length, 1, `${manifest.id} lacks ${mandatory}`);
      }
    }
  });

  it('keeps the documented gaps out of the schema until the owning mission defines them', () => {
    for (const fields of Object.values(GAPS)) {
      for (const field of fields) assert.equal(schemaAt(latest, toTokens(field)), undefined, `${field} is now defined: update the gap list`);
    }
  });
});
