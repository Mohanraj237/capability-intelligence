"""Second, independent check of the caveman case-study manifests (optional; Python).

Uses Python jsonschema (Draft 2020-12) and PyYAML instead of the Node.js validator, with the schemas
under schema/ unchanged, to check that the verdicts do not depend on one implementation:

  1. every manifest passes the manifest schema, with and without format assertions;
  2. PyYAML (a YAML 1.1 parser) reads every value the way the Node.js (YAML 1.2) validator does,
     and rejects duplicate keys, which PyYAML would otherwise resolve silently;
  3. the Node.js validator's JSON report for the set conforms to the validation-report contract;
  4. the real value `off` (a mode id) survives as the string "off", not the boolean False.

    python3 -m pip install jsonschema pyyaml
    python3 case-studies/caveman/crosscheck.py

Exit code 0 when everything agrees, 1 otherwise.
"""
import datetime
import json
import pathlib
import subprocess
import sys

import yaml
from jsonschema import Draft202012Validator, FormatChecker

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
# The manifests live with the rest of the production reference set; this folder keeps the scripts.
MANIFESTS = ROOT / "case-studies" / "production-set" / "manifests" / "caveman"


class StrictLoader(yaml.SafeLoader):
    """SafeLoader that refuses duplicate mapping keys."""


def _construct_mapping(loader, node, deep=False):
    seen = set()
    for key_node, _ in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in seen:
            raise yaml.constructor.ConstructorError(None, None, f"duplicate key {key!r}", key_node.start_mark)
        seen.add(key)
    return yaml.SafeLoader.construct_mapping(loader, node, deep)


StrictLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _construct_mapping)


def errors_of(validator, data):
    return [f"{'/'.join(map(str, e.absolute_path)) or '/'}: {e.message}" for e in validator.iter_errors(data)]


def check_manifests():
    """Each manifest against the schema, with and without format assertions, read by a strict PyYAML."""
    schema = json.loads((ROOT / "schema/0.1/capability.schema.json").read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    plain = Draft202012Validator(schema)
    with_formats = Draft202012Validator(schema, format_checker=FormatChecker())
    problems = 0
    print(f"{'manifest':<46} {'schema':<8} {'formats':<8} {'types':<8}")
    for path in sorted(MANIFESTS.glob("*.capability.yaml")):
        data = yaml.load(path.read_text(encoding="utf-8"), Loader=StrictLoader)
        e1, e2 = errors_of(plain, data), errors_of(with_formats, data)
        # PyYAML must see strings where the manifest quotes them, and no unexpected booleans or dates.
        stray = [k for k, v in data.items() if isinstance(v, (bool, datetime.date))]
        problems += 0 if not (e1 or e2 or stray) else 1
        print(f"{path.name:<46} {'valid' if not e1 else 'INVALID':<8} {'valid' if not e2 else 'INVALID':<8} {'ok' if not stray else 'STRAY':<8}")
        for line in e1 + e2 + [f"unexpected non-string top-level value: {k}" for k in stray]:
            print(f"    {line}")
    return problems


def check_mode_id():
    """The real mode id 'off' must stay a string; unquoted, a YAML 1.1 parser reads it as False."""
    bundle = yaml.load((MANIFESTS / "caveman-plugin.capability.yaml").read_text(encoding="utf-8"), Loader=StrictLoader)
    off = bundle["x-modes"]["storedModes"][0]
    print(f"\nstoredModes[0] read by PyYAML: {off!r} ({type(off).__name__})")
    if off != "off":
        print("    PROBLEM: the mode id off was read as something other than the string 'off'")
        return 1
    return 0


def check_report():
    """The Node.js validator's own JSON report must conform to the published validation-report contract."""
    run = subprocess.run(["node", str(ROOT / "bin/capability-manifest.js"), "validate", str(MANIFESTS), "--format", "json"],
                         capture_output=True, text=True, cwd=ROOT)
    report = json.loads(run.stdout)
    contract = json.loads((ROOT / "schema/contracts/validation-report-0.1.schema.json").read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(contract)
    contract_errors = errors_of(Draft202012Validator(contract, format_checker=FormatChecker()), report)
    summary = report["summary"]
    print(f"validation report: {summary['manifests']} manifests, {summary['valid']} valid, {summary['errors']} errors; "
          f"contract check: {'conforms' if not contract_errors else 'DOES NOT CONFORM'}")
    for line in contract_errors:
        print(f"    {line}")
    return len(contract_errors)


def main():
    problems = check_manifests() + check_mode_id() + check_report()
    print(f"\n{'Python and Node.js agree.' if problems == 0 else f'{problems} problem(s).'}")
    return 0 if problems == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
