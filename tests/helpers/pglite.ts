import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../../lib/db";
import { setDbForTests } from "../../lib/db";

/** Wraps PGlite in the same tagged-template shape the Neon driver exposes. */
export async function makeTestDb(): Promise<{ sql: Sql; close: () => Promise<void> }> {
  const pg = new PGlite();
  await pg.waitReady;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = async (text: string, params: any[] = []) => {
    const res = await pg.query(text, params);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return res.rows as Record<string, any>[];
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sql = (async (strings: TemplateStringsArray, ...values: any[]) => {
    const text = strings.reduce((acc, s, i) => acc + s + (i < values.length ? `$${i + 1}` : ""), "");
    return query(text, values);
  }) as Sql;
  sql.query = query;
  setDbForTests(sql);
  return { sql, close: () => pg.close() };
}
