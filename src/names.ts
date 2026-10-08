/*
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.
 */

/**
 * Resolves what the user typed to a stored name: exact match first, then a
 * case-insensitive match, then a unique case-insensitive prefix.
 */
export function findName(names: string[], query: string): { name: string } | { error: string } {
  if (names.includes(query)) return { name: query };
  const q = query.toLowerCase();
  const exact = names.filter((n) => n.toLowerCase() === q);
  if (exact.length === 1) return { name: exact[0] };
  const matches = exact.length ? exact : names.filter((n) => n.toLowerCase().startsWith(q));
  if (matches.length === 1) return { name: matches[0] };
  if (matches.length > 1) return { error: `${query} matches several authenticators: ${matches.join(', ')}` };
  return { error: `${query} not found.` };
}
