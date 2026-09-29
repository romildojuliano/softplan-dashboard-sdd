import assert from 'node:assert/strict';
import { test } from 'node:test';

import { serializeCsv } from './csv.ts';

test('CSV serialization quotes fields, escapes quotes, preserves embedded lines, and adds UTF-8 BOM', () => {
  assert.equal(
    serializeCsv(['Fornecedor', 'Descrição', 'Valor'], [
      ['Alpha; "Beta"', 'linha 1\r\nlinha 2', 42],
      ['São Paulo', null, undefined],
    ]),
    '\uFEFF"Fornecedor";"Descrição";"Valor"\r\n"Alpha; ""Beta""";"linha 1\r\nlinha 2";"42"\r\n"São Paulo";"";""',
  );
});
