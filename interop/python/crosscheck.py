"""Second, independent consumer of the manifest contract (evaluation harness, optional).

Validates the example manifests with Python jsonschema (Draft 2020-12) and PyYAML, using the
schemas under schema/<version>/ unchanged and routing each manifest by its schemaVersion, to check
that the contract does not depend on the Node.js validator. Expected verdicts come from the
example layout: files under examples/invalid must fail structural validation and all other
examples must pass. The probes reproduce the known differences between parsers and validators
(see docs/manifest-spec.md section 12).

    python3 -m pip install jsonschema pyyaml
    python3 interop/python/crosscheck.py

Exit code 0 when every example verdict matches its expectation, 1 otherwise.
"""
import json
import pathlib
import sys

import yaml
from jsonschema import Draft202012Validator, FormatChecker

ROOT = pathlib.Path(__file__).resolve().parents[2]

# One pair of validators per registered schema version, keyed by the version each schema declares,
# so that manifests are routed by their schemaVersion exactly as the Node.js validator does.
VALIDATORS = {}
for schema_file in sorted(ROOT.glob("schema/*/capability.schema.json")):
    schema = json.loads(schema_file.read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)  # meta-schema check by an independent implementation
    VALIDATORS[schema["properties"]["schemaVersion"]["const"]] = (
        Draft202012Validator(schema),  # Draft 2020-12 default: "format" is an annotation only
        Draft202012Validator(schema, format_checker=FormatChecker()),
    )
DEFAULT, WITH_FORMATS = VALIDATORS["0.1"]


def is_valid(validator, data):
    return not any(True for _ in validator.iter_errors(data))


def route(data):
    """Validators for the manifest's declared version; None when that version is not supported."""
    return VALIDATORS.get(data.get("schemaVersion")) if isinstance(data, dict) else None


def verdict(valid):
    return "valid" if valid else "invalid"


def main():
    mismatches = 0
    print(f"{'example':<70} {'expected':<9} {'default':<9} {'formats':<9}")
    for path in sorted(ROOT.glob("examples/**/*.yaml")):
        relative = path.relative_to(ROOT).as_posix()
        expected = not relative.startswith("examples/invalid/")
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        validators = route(data)
        default, formats = (is_valid(validators[0], data), is_valid(validators[1], data)) if validators else (False, False)
        ok = default == expected and formats == expected
        mismatches += 0 if ok else 1
        print(f"{relative:<70} {verdict(expected):<9} {verdict(default):<9} {verdict(formats):<9} {'' if ok else 'MISMATCH'}")

    base = (ROOT / "examples/valid/sql-review.capability.yaml").read_text(encoding="utf-8")
    probes = [
        ("unquoted date", base.replace('lastUpdated: "2026-10-12"', "lastUpdated: 2026-10-12"),
         "Node: valid + YAML_PORTABILITY warning"),
        ("impossible date 2026-02-30", base.replace('lastUpdated: "2026-10-12"', 'lastUpdated: "2026-02-30"'),
         "Node: invalid (INVALID_FORMAT)"),
        ("duplicate key riskTier", base.replace("riskTier: low\n", "riskTier: high\nriskTier: low\n"),
         "Node: invalid (DUPLICATE_KEY)"),
    ]
    print("\nProbes (expected to differ from the Node.js validator):")
    for name, text, node in probes:
        data = yaml.safe_load(text)
        print(f"  {name:<28} default={verdict(is_valid(DEFAULT, data)):<8} formats={verdict(is_valid(WITH_FORMATS, data)):<8}"
              f" PyYAML read lastUpdated as {type(data['lastUpdated']).__name__}, riskTier as {data['riskTier']!r}; {node}")

    print(f"\n{'All example verdicts match.' if mismatches == 0 else f'{mismatches} example verdict(s) differ.'}")
    return 0 if mismatches == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
