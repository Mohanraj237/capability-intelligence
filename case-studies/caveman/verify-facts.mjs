#!/usr/bin/env node
// Checks the facts in the caveman case-study manifests against a local clone of the repository.
// Schema validation says a manifest is well formed; this says its values are true.
//
//   git clone https://github.com/JuliusBrussee/caveman.git <dir>
//   git -C <dir> checkout 3dc497a7f858c774d6e15b25e8c6120ef3a0eda8   # the commit the manifests were read from
//   node case-studies/caveman/verify-facts.mjs <dir> [--online]
//
// At a later commit a failure can be legitimate: the repository changed after 2026-11-09.
//
// The clone is read as data only: files are parsed and `git log` / `git tag` are run against it.
// Nothing from the clone is executed. --online also compares repository facts with the GitHub API.
// Exit code 0 when every check passes, 1 otherwise.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const clone = process.argv[2] ? resolve(process.argv[2]) : null;
const online = process.argv.includes('--online');
if (!clone || !existsSync(join(clone, '.claude-plugin/plugin.json'))) {
  console.error('usage: node case-studies/caveman/verify-facts.mjs <path to a caveman clone> [--online] [--manifests <dir>]');
  process.exit(2);
}
// --manifests reads the manifests from another directory (used by mutation-tests.mjs on edited copies).
const manifestsFlag = process.argv.indexOf('--manifests');
// By default the manifests are read from the production reference set, where they now live.
const here = manifestsFlag > 0
  ? resolve(process.argv[manifestsFlag + 1])
  : resolve(dirname(fileURLToPath(import.meta.url)), '../production-set/manifests/caveman');

const fold = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const read = (path) => readFileSync(join(clone, path), 'utf8');
const json = (path) => JSON.parse(read(path));
const frontMatter = (path) => {
  const match = read(path).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? parse(match[1]) : {};
};
const manifest = (file) => parse(readFileSync(join(here, file), 'utf8'));
const git = (...args) => execFileSync('git', ['-C', clone, ...args], { encoding: 'utf8' }).trim();
const lastCommitDate = (path) => new Date(git('log', '-1', '--format=%cI', '--', path)).toISOString().slice(0, 10);
const sameSet = (a, b) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

let failed = 0;
let total = 0;
const check = (id, text, ok, detail = '') => {
  total += 1;
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id.padEnd(4)} ${text}${!ok && detail ? `\n          ${detail}` : ''}`);
};

const bundle = manifest('caveman-plugin.capability.yaml');
const pluginJson = json('.claude-plugin/plugin.json');
const marketplace = json('.claude-plugin/marketplace.json');
const pkg = json('package.json');

// ---- Bundle identity ---------------------------------------------------------------------
check('B1', 'description equals plugin.json description', fold(bundle.description) === fold(pluginJson.description));
check('B2', 'capabilityVersion and publication nativeVersion equal plugin.json version',
  bundle.capabilityVersion === pluginJson.version && bundle.publications[0].nativeVersion === pluginJson.version,
  `plugin.json says ${pluginJson.version}`);
check('B3', 'locator is <plugin>@<marketplace> and both names exist in marketplace.json',
  bundle.publications[0].locator === `${pluginJson.name}@${marketplace.name}`
    && marketplace.plugins.some((p) => p.name === pluginJson.name && p.source === './'));
check('B4', 'install coordinate and marketplace add command appear in README.md',
  read('README.md').includes('claude plugin install caveman@caveman') && read('README.md').includes('plugin marketplace add JuliusBrussee/caveman'));
check('B5', 'owner.name equals plugin.json author.name', bundle.owner.name === pluginJson.author.name);
check('B6', 'owner.contact equals package.json bugs.url', bundle.owner.contact === pkg.bugs.url);
check('B7', 'license: package.json says Apache-2.0, LICENSE is the Apache text, LICENSING.md covers the whole repository',
  pkg.license === bundle.license.expression && /Apache License/.test(read('LICENSE').slice(0, 200))
    && /Everything in this repository is licensed under the Apache License, Version 2\.0/.test(fold(read('LICENSING.md'))));
check('B8', 'Caveman Cloud is stated to be separate commercial software (costInformation)',
  /Caveman Cloud, the hosted service, is separate commercial software/.test(fold(read('LICENSING.md'))));
check('B9', 'tag v4.1.0 exists and the publication date equals the last commit to .claude-plugin',
  git('tag', '--list', `v${pluginJson.version}`) === `v${pluginJson.version}`
    && lastCommitDate('.claude-plugin') === bundle.publications[0].updatedAt, `last commit to .claude-plugin: ${lastCommitDate('.claude-plugin')}`);

// ---- Skills: all 22 accounted for -------------------------------------------------------
const skillDirs = readdirSync(join(clone, 'skills'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(clone, 'skills', d.name, 'SKILL.md'))).map((d) => d.name);
const children = ['caveman', 'ultracave', 'megacave', 'caveman-commit', 'caveman-review'].map((n) => manifest(`${n}.capability.yaml`));
const childNames = children.map((c) => c.source.path.replace('skills/', ''));
const embeddedSkills = bundle.embeddedComponents.filter((c) => c.type === 'skill');
const embeddedSkillNames = embeddedSkills.map((c) => c.name);
check('S1', `skills/ holds ${skillDirs.length} skills; components + embedded skills cover exactly that set`,
  sameSet(skillDirs, [...childNames, ...embeddedSkillNames]) && skillDirs.length === 22, `skills/: ${skillDirs.join(', ')}`);
check('S2', 'the count "22" in the bundle text matches skills/', /22 Agent Skills/.test(bundle.interfaces[1].description) && /all 22 skill descriptions/.test(bundle.limitations[0]));
check('S3', 'components list the same five ids as the child manifests, and each child names the bundle as parent',
  sameSet(bundle.components.map((c) => c.id), children.map((c) => c.id)) && children.every((c) => c.parent.id === bundle.id));
check('S4', 'plugin.json has no skills key, so skills/ is auto-discovered (no allowlist)', !('skills' in pluginJson) && /There is no allowlist/.test(read('CLAUDE.md')));
check('S5', 'every embedded skill description equals the SKILL.md front matter',
  embeddedSkills.every((c) => fold(c.description) === fold(frontMatter(`skills/${c.name}/SKILL.md`).description)),
  embeddedSkills.filter((c) => fold(c.description) !== fold(frontMatter(`skills/${c.name}/SKILL.md`).description)).map((c) => c.name).join(', '));
check('S6', 'CLAUDE.md calls caveman-commit and caveman-review fully independent, ultracave and megacave self-contained',
  (read('CLAUDE.md').match(/Fully independent skill/g) ?? []).length >= 2 && /ultracave[\s\S]{0,200}megacave[\s\S]{0,200}self-contained/.test(read('CLAUDE.md')));

// ---- Subagents, command, hooks ----------------------------------------------------------
const agentFiles = readdirSync(join(clone, 'agents')).filter((f) => f.endsWith('.md'));
const agents = agentFiles.map((f) => frontMatter(`agents/${f}`));
const embeddedAgents = bundle.embeddedComponents.filter((c) => c.type === 'agent');
check('A1', 'agents/ holds exactly the embedded subagents', sameSet(agents.map((a) => a.name), embeddedAgents.map((c) => c.name)));
check('A2', 'embedded subagent descriptions equal the front matter; a description over 300 characters is omitted',
  embeddedAgents.every((c) => {
    const native = fold(agents.find((a) => a.name === c.name).description);
    return c.description === undefined ? native.length > 300 : fold(c.description) === native && native.length <= 300;
  }), agents.map((a) => `${a.name}=${fold(a.description).length}`).join(', '));
const commandFiles = readdirSync(join(clone, 'commands')).filter((f) => f.endsWith('.md'));
const embeddedCommands = bundle.embeddedComponents.filter((c) => c.type === 'command');
check('C1', 'commands/ holds exactly one .md, equal to the embedded command and its description',
  commandFiles.length === 1 && embeddedCommands.length === 1
    && embeddedCommands[0].name === commandFiles[0].replace(/\.md$/, '')
    && fold(embeddedCommands[0].description) === fold(frontMatter(`commands/${commandFiles[0]}`).description));
const hookRows = Object.entries(pluginJson.hooks).flatMap(([event, groups]) => groups.flatMap((g) => g.hooks.map((h) => {
  const m = h.command.match(/src\/hooks\/([a-z-]+\.js)"?\s*(--[a-z-]+)?/);
  return { event, text: `Runs src/hooks/${m[1]}${m[2] ? ` ${m[2]}` : ''} (timeout ${h.timeout} s). Status message "${h.statusMessage}".`, nodeGuard: h.command.includes('command -v node') };
})));
const embeddedHooks = bundle.embeddedComponents.filter((c) => c.type === 'hook');
check('H1', 'embedded hooks equal the four events in plugin.json, with script, flag, timeout and status message',
  hookRows.length === 4 && embeddedHooks.length === 4
    && hookRows.every((r) => embeddedHooks.find((c) => c.name === r.event)?.description === r.text),
  hookRows.map((r) => `${r.event}: ${r.text}`).join(' | '));
check('H2', 'every hook command guards on node being on PATH and exits 0 otherwise', hookRows.every((r) => r.nodeGuard));
check('H3', 'embedded components total 25 (17 skills, 3 agents, 1 command, 4 hooks)',
  bundle.embeddedComponents.length === 25 && embeddedSkills.length === 17 && embeddedAgents.length === 3);

// ---- Modes and setup ---------------------------------------------------------------------
const config = read('src/hooks/caveman-config.js');
const listOf = (text) => [...text.matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
const validModes = listOf(config.match(/const VALID_MODES = \[([\s\S]*?)\];/)[1]);
const legacy = Object.fromEntries([...config.match(/const LEGACY_MODES = \{([\s\S]*?)\};/)[1].matchAll(/'?([a-z-]+)'?:\s*'([a-z]+)'/g)].map((m) => [m[1], m[2]]));
const modes = bundle['x-modes'];
check('M1', 'x-modes.storedModes equals VALID_MODES in caveman-config.js (order included)', JSON.stringify(modes.storedModes) === JSON.stringify(validModes), `source: ${validModes.join(', ')}`);
check('M2', 'x-modes.legacyAliases equals LEGACY_MODES', JSON.stringify(modes.legacyAliases) === JSON.stringify(legacy), JSON.stringify(legacy));
check('M3', "VALID_DEFAULT_MODES adds exactly 'manual' and the default is caveman",
  /VALID_DEFAULT_MODES = \[\.\.\.VALID_MODES, 'manual'\]/.test(config) && JSON.stringify(modes.startupOnly) === '["manual"]'
    && modes.defaultMode === 'caveman' && /4\. 'caveman'/.test(config));
check('M4', 'every stored mode with a skill has a skill directory (caveman, ultracave, megacave)', ['caveman', 'ultracave', 'megacave'].every((m) => skillDirs.includes(m)));
check('M5', 'the CAVEMAN_DEFAULT_MODE setup text names every accepted default mode',
  [...validModes, 'manual'].every((mode) => fold(bundle.setup.find((s) => s.name === 'CAVEMAN_DEFAULT_MODE').description).includes(mode)));
check('P1', 'CAVEMAN_DEFAULT_MODE and CAVEMAN_REINFORCE are read by caveman-config.js; CAVE_API_KEY is in the caveman-setup skill',
  bundle.setup.map((s) => s.name).every((n) => (n === 'CAVE_API_KEY' ? read('skills/caveman-setup/SKILL.md') : config).includes(n)));

// ---- Limitations are sourced -------------------------------------------------------------
check('L1', 'compress: python3 -m scripts, and "Data leaves the machine" with claude CLI / Anthropic API / OpenAI-compatible',
  /python3 -m scripts/.test(read('skills/caveman-compress/SKILL.md')) && /Data leaves the machine/.test(read('skills/caveman-compress/SKILL.md'))
    && /the `claude` CLI, the Anthropic API, or an OpenAI-compatible endpoint/.test(read('skills/caveman-compress/SKILL.md')));
check('L2', 'setup needs CAVE_API_KEY; optimize needs a logged-in CLI; manage and evidence-review stop without a login',
  /CAVE_API_KEY/.test(read('skills/caveman-setup/SKILL.md')) && /logged-in Caveman CLI session/.test(read('skills/caveman-optimize/SKILL.md'))
    && /Stop if login/.test(read('skills/caveman-manage/SKILL.md')) && /caveman login/.test(read('skills/caveman-evidence-review/SKILL.md')));
check('L3', 'caveman-learn runs `caveman learn report --json`', read('skills/caveman-learn/SKILL.md').includes('caveman learn report --json'));
check('L4', 'HONEST-NUMBERS: caveman 3%, ultracave 35%, megacave 9% at the median, n=10; GitHub Copilot per-request billing',
  /caveman 3%, ultracave 35%, megacave 9% at the median \(n=10/.test(read('docs/HONEST-NUMBERS.md')) && /GitHub Copilot charges premium \*requests\*/.test(read('docs/HONEST-NUMBERS.md')));

// ---- Children ----------------------------------------------------------------------------
for (const child of children) {
  const dir = child.source.path;
  const native = frontMatter(`${dir}/SKILL.md`);
  const flag = native['disable-model-invocation'] === true;
  check('K1', `${child.id}: description, SKILL.md path, contractRef and updatedAt match`,
    fold(child.description) === fold(native.description) && existsSync(join(clone, dir, 'SKILL.md'))
      && child.interfaces[0].contractRef.endsWith(`/${dir}/SKILL.md`) && child.source.updatedAt === lastCommitDate(dir)
      && child.publications[0].nativeVersion === 'main', `git says ${lastCommitDate(dir)}`);
  check('K2', `${child.id}: x-invocation.disableModelInvocation equals the front matter flag (${flag})`, child['x-invocation'].disableModelInvocation === flag);
}

// ---- Repository identity (online) --------------------------------------------------------
if (online) {
  const repo = await (await fetch('https://api.github.com/repos/JuliusBrussee/caveman', { headers: { 'user-agent': 'capability-manifest-case-study' } })).json();
  check('R1', 'GitHub API: id equals source.repositoryId; not archived; not a fork; Apache-2.0', String(repo.id) === bundle.source.repositoryId && repo.archived === false && repo.fork === false && repo.license?.spdx_id === 'Apache-2.0', `API: id ${repo.id}, archived ${repo.archived}, license ${repo.license?.spdx_id}`);
  check('R2', 'GitHub API: homepage equals documentation; every keyword after the first is a topic', repo.homepage === bundle.documentation && bundle.keywords.slice(1).every((k) => repo.topics.includes(k)), `API homepage ${repo.homepage}; topics ${repo.topics?.join(', ')}`);
  check('R3', 'GitHub API: source.updatedAt (the last push, UTC date) equals pushed_at', bundle.source.updatedAt === repo.pushed_at.slice(0, 10), `API pushed_at ${repo.pushed_at}`);
} else {
  console.log('SKIP  R1-R3 repository identity (run with --online)');
}

console.log(`\n${total - failed} of ${total} checks passed${failed ? `, ${failed} FAILED` : ''}.`);
process.exit(failed ? 1 : 0);
