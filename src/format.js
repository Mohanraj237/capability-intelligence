// Human-readable output. Machine-readable output is the JSON produced by the same objects.

export function formatValidationReport(report) {
  const lines = [`${report.tool} ${report.toolVersion} - supported schema versions: ${report.supportedSchemaVersions.join(', ')}`, ''];

  for (const result of report.results) {
    const subject = [result.id, result.capabilityType, describeSchema(result)].filter(Boolean).join(' - ');
    const checks = Object.entries(result.checks).map(([check, status]) => `${check} ${status}`).join(', ');
    lines.push(`${result.valid ? 'VALID  ' : 'INVALID'}  ${result.file}`, `         ${subject}`, `         checks: ${checks}`);
    if (result.completeness) lines.push(`         completeness: ${describeCompleteness(result.completeness)}`);
    for (const finding of result.findings) lines.push(...formatFinding(finding, '         '));
    lines.push('');
  }

  const { summary } = report;
  lines.push(
    `Summary: ${summary.manifests} manifest(s): ${summary.valid} valid, ${summary.invalid} invalid - ` +
      `${summary.errors} error(s), ${summary.warnings} warning(s), ${summary.unverified} unverified check(s)`,
  );
  const assessed = report.results.filter((result) => result.completeness);
  if (assessed.length > 0) {
    const levels = ['none', ...Object.keys(assessed[0].completeness.unmet)];
    const counts = levels.map((level) => `${level} ${assessed.filter((result) => result.completeness.level === level).length}`);
    lines.push(`Completeness of the ${assessed.length} structurally valid manifest(s): ${counts.join(', ')}`);
  }
  lines.push(`Note: ${report.notice}`);
  return lines.join('\n');
}

// "assessable (adoptable needs: setup, owner contact)". Levels are cumulative, so the first level
// with missing facts is the one right above the level reached.
function describeCompleteness({ level, unmet }) {
  const next = Object.entries(unmet).find(([, facts]) => facts.length > 0);
  return next ? `${level} (${next[0]} needs: ${next[1].join(', ')})` : `${level} (highest level)`;
}

export function formatCompatibilityReport(result) {
  const lines = [`Compatibility: ${result.previousFile} -> ${result.nextFile}`];

  if (!result.comparable) {
    lines.push('  Not compared: both revisions must first pass structural validation.');
    for (const finding of result.findings) lines.push(`  in ${finding.file}:`, ...formatFinding(finding, '    '));
    lines.push('Result: FAILED');
    return lines.join('\n');
  }

  const versions = result.previousVersion && result.nextVersion
    ? `${result.previousVersion} -> ${result.nextVersion} (${result.actualBump})`
    : 'not declared in both revisions';
  lines.push(
    `  capabilityVersion: ${versions}; required bump: ${result.requiredBump.toUpperCase()}`,
    `  backward compatible: ${result.backwardCompatible ? 'yes' : 'no'}; versioning: ${result.versioning}; ` +
      `lifecycle: ${result.lifecycle}; identity: ${result.identity}`,
  );

  if (result.changes.length > 0) {
    lines.push('  Changes:');
    const width = Math.max(...result.changes.map((change) => change.code.length));
    for (const change of result.changes) {
      lines.push(`    ${change.impact.toUpperCase().padEnd(8)}  ${change.code.padEnd(width)}  ${change.message}`);
    }
  } else {
    lines.push('  Changes: none');
  }

  if (result.findings.length > 0) {
    lines.push('  Findings:');
    for (const finding of result.findings) lines.push(...formatFinding(finding, '    '));
  }

  const errors = result.findings.filter((finding) => finding.severity === 'error').length;
  lines.push(`Result: ${result.ok ? 'PASSED' : `FAILED (${errors} error(s))`}`);
  return lines.join('\n');
}

// Summary view of an exchange document. It reads only common manifest fields, through one code
// path for every capability type, and never shows a missing or unassessed risk tier as low.
export function formatExchange(document) {
  const rows = document.capabilities.map(({ manifest, validation }) => {
    const riskTier = manifest.riskTier ?? 'unassessed';
    const affiliation = manifest.owner?.affiliation ? ` (${manifest.owner.affiliation})` : '';
    return [
      manifest.id,
      manifest.capabilityType,
      `schema ${manifest.schemaVersion}`,
      validation?.completeness ?? '-',
      manifest.lifecycleStatus ?? '-',
      manifest.maturity ?? '-',
      manifest.capabilityVersion ?? '-',
      riskTier === 'unassessed' ? 'UNASSESSED' : `${riskTier} (${manifest.assessmentReference.id})`,
      manifest.owner ? `${manifest.owner.name}${affiliation}` : '-',
    ];
  });
  const header = ['ID', 'TYPE', 'SCHEMA', 'LEVEL', 'LIFECYCLE', 'MATURITY', 'VERSION', 'RISK', 'OWNER'];
  const widths = header.map((title, column) => Math.max(title.length, ...rows.map((row) => row[column].length)));
  const render = (row) => row.map((cell, column) => cell.padEnd(widths[column])).join('  ').trimEnd();

  const lines = [render(header), ...rows.map(render), ''];
  lines.push(`Exchange document ${document.exchangeFormatVersion}: ${document.capabilities.length} capability manifest(s), ${document.rejected.length} rejected input(s).`);
  for (const rejected of document.rejected) {
    lines.push(`  rejected: ${rejected.file} (${rejected.errorCount} error(s): ${rejected.errorCodes.join(', ')})`);
  }
  lines.push(
    'UNASSESSED = no risk assessment recorded: not low risk and not approved. "-" = not provided in the manifest.',
    'A risk tier is not an approval; approval is decided by governance processes, not by the manifest.',
  );
  return lines.join('\n');
}

export function formatSchemaCompatibility(result) {
  const lines = [`Schema compatibility: ${result.previousVersion} -> ${result.nextVersion}`];
  const nonBreaking = ['additive', 'relaxation'].includes(result.classification) ? ' (non-breaking)' : '';
  lines.push(
    `  classification: ${result.classification}${nonBreaking}; required bump: ${result.requiredBump.toUpperCase()}; ` +
      `actual bump: ${String(result.actualBump).toUpperCase()}`,
  );

  const contractChanges = result.changes.filter((change) => change.impact !== 'annotation');
  const annotations = result.changes.filter((change) => change.impact === 'annotation');
  if (contractChanges.length > 0) {
    lines.push('  Changes:');
    const codeWidth = Math.max(...contractChanges.map((change) => change.code.length));
    const pathWidth = Math.max(...contractChanges.map((change) => change.path.length));
    for (const change of contractChanges) {
      lines.push(`    ${change.impact.toUpperCase().padEnd(10)}  ${change.code.padEnd(codeWidth)}  ${change.path.padEnd(pathWidth)}  ${change.message}`);
    }
  } else {
    lines.push('  Changes: none to the contract');
  }
  if (annotations.length > 0) {
    lines.push(`  Annotation-only changes (descriptions, examples, hints): ${annotations.map((change) => change.path).join(', ')}`);
  }
  if (result.corpus) {
    const { checked, stillValid, regressions } = result.corpus;
    lines.push(`  Corpus: ${checked} manifest(s) valid under ${result.previousVersion} re-declared as ${result.nextVersion}: ${stillValid} still valid.`);
    for (const regression of regressions) lines.push(`    regression: ${regression.file} (${regression.codes.join(', ')})`);
  }
  for (const finding of result.findings) {
    lines.push(`  ${finding.severity.toUpperCase()}  ${finding.code}`, `    ${finding.message}`, `    fix: ${finding.hint}`);
  }
  lines.push(`Result: ${result.ok ? 'PASSED' : 'FAILED'}`);
  return lines.join('\n');
}

function describeSchema(result) {
  if (!result.validatedAgainst) return 'not validated against any schema';
  const assumed = result.schemaVersion === result.validatedAgainst ? '' : ' (latest; declared schemaVersion is missing or malformed)';
  return `validated against schema ${result.validatedAgainst}${assumed}`;
}

function formatFinding(finding, indent) {
  const location = finding.line ? ` (line ${finding.line}, col ${finding.column})` : '';
  const lines = [`${indent}${finding.severity.toUpperCase()}  ${finding.code}  ${finding.path || '/'}${location}`, `${indent}  ${finding.message}`];
  // Unverified checks are not failures, so their hint is a next step rather than a fix.
  if (finding.hint) lines.push(`${indent}  ${finding.severity === 'unverified' ? 'next' : 'fix'}: ${finding.hint}`);
  return lines;
}
