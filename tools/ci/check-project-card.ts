/**
 * Validates `project.v1.yaml` against the fleet schema owned by governance.
 *
 * The card is the single state authority of this project (ADR-0020): phases,
 * weighted exit criteria, dated evidence. The schema refuses `status: accepted`
 * without an `evidence` block, which is the whole point — a criterion declared
 * met without something a reader can open is not met.
 *
 * The schema is read from the pinned governance git-dep rather than copied
 * here: a duplicated schema drifts, and a drifted schema validates nothing.
 */

import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

const SCHEMA_PATH = "node_modules/@libre-ai/governance/ecosystem/schemas/project.v1.schema.json";
const CARD_PATH = "project.v1.yaml";

async function main(): Promise<number> {
  const schemaFile = Bun.file(SCHEMA_PATH);
  if (!(await schemaFile.exists())) {
    console.error(`Schema not found at ${SCHEMA_PATH} — run \`bun install\` first.`);
    return 1;
  }

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile((await schemaFile.json()) as object);

  const card: unknown = Bun.YAML.parse(await Bun.file(CARD_PATH).text());

  if (validate(card)) {
    console.log(`OK: ${CARD_PATH} conforms to libre-ai.project.v1.`);
    return 0;
  }

  for (const error of validate.errors ?? []) {
    console.error(`${error.instancePath || "/"}: ${error.message} (${error.keyword})`);
  }
  console.error(`\n${CARD_PATH} is invalid.`);
  return 1;
}

process.exit(await main());
