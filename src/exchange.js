// Capability Exchange Document: the machine-readable contract through which validated manifests
// are passed between teams (schema/contracts/exchange-document-0.1.schema.json).
//
// Mission 4 owns this structure, not its content: the manifests are carried unchanged, with no
// transformation, and the inventory they describe belongs to the inventory owners. The document
// keeps each manifest's warnings, unverified checks, and completeness level, so that consumers see
// what was not confirmed and which records are partial, and it records which inputs were rejected.

export const EXCHANGE_FORMAT_VERSION = '0.1';

export function buildExchangeDocument(report) {
  const accepted = report.results.filter((result) => result.valid);
  const codes = (result, severity) => [...new Set(result.findings.filter((f) => f.severity === severity).map((f) => f.code))];

  return {
    exchangeFormatVersion: EXCHANGE_FORMAT_VERSION,
    generator: { name: report.tool, version: report.toolVersion },
    schemaVersions: [...new Set(accepted.map((result) => result.manifest.schemaVersion))].sort((a, b) => a.localeCompare(b)),
    notice: report.notice,
    capabilities: accepted
      .map((result) => ({
        manifest: result.manifest,
        validation: {
          warnings: codes(result, 'warning'),
          unverified: codes(result, 'unverified'),
          ...(result.completeness ? { completeness: result.completeness.level } : {}),
        },
      }))
      .sort((a, b) => a.manifest.id.localeCompare(b.manifest.id)),
    rejected: report.results
      .filter((result) => !result.valid)
      .map((result) => {
        const errors = result.findings.filter((f) => f.severity === 'error');
        return { file: result.file, id: result.id ?? null, errorCount: errors.length, errorCodes: [...new Set(errors.map((f) => f.code))] };
      }),
  };
}
