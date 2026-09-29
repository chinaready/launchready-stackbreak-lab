#!/usr/bin/env node
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Validates probe/targets.json + probe/targets-community.json (registry v2).
// targets.schema.json covers single-document shape for editor support; this
// validator is the CI source of truth and additionally enforces cross-file
// rules (id uniqueness, vendor existence) and tier-specific requirements.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const CATEGORIES = ['fonts', 'auth', 'analytics', 'embeds'];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HTTPS = /^https:\/\//;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validateService(svc, where, vendors, errors, seenIds, defaultTier) {
  const label = `${where} "${svc?.id ?? '<missing id>'}"`;
  for (const f of ['id', 'name', 'category', 'domain', 'url', 'vendor']) {
    if (typeof svc?.[f] !== 'string' || svc[f].trim() === '') errors.push(`${label}: ${f} is required`);
  }
  if (typeof svc?.id === 'string' && SLUG.test(svc.id)) {
    if (seenIds.has(svc.id)) errors.push(`${label}: duplicate id "${svc.id}" (already used in this registry set)`);
    else seenIds.add(svc.id);
  } else {
    errors.push(`${label}: id must be a kebab-case slug (lowercase letters/digits/hyphens)`);
  }
  if (!CATEGORIES.includes(svc?.category)) errors.push(`${label}: category "${svc?.category}" not in [${CATEGORIES.join(', ')}]`);
  if (!HTTPS.test(svc?.url ?? '')) errors.push(`${label}: url must start with https://`);
  if (!vendors.has(svc?.vendor)) errors.push(`${label}: unknown vendor "${svc?.vendor}" (declare it in targets.json meta.vendors first)`);
  if (Array.isArray(svc?.categories)) {
    if (svc.categories.length === 0 || !svc.categories.every(c => CATEGORIES.includes(c)))
      errors.push(`${label}: categories must be a non-empty subset of [${CATEGORIES.join(', ')}]`);
    else if (!svc.categories.includes(svc.category))
      errors.push(`${label}: category "${svc.category}" must appear in categories [${svc.categories.join(', ')}]`);
  }
  const tier = svc?.tier ?? defaultTier;
  if (tier === 'curated') {
    if (!svc?.demoPath) errors.push(`${label}: curated targets require demoPath`);
  } else if (tier === 'community') {
    if (svc?.demoPath) errors.push(`${label}: community targets must not set demoPath (network-probe only)`);
    if (typeof svc?.submittedBy !== 'string' || svc.submittedBy.trim() === '') errors.push(`${label}: community targets require submittedBy (GitHub handle)`);
    if (!DATE_RE.test(svc?.addedAt ?? '')) errors.push(`${label}: community targets require addedAt as YYYY-MM-DD`);
  } else {
    errors.push(`${label}: tier must be "curated" or "community"`);
  }
}

export function validateRegistries(curated, community) {
  const errors = [];
  const vendors = new Map(Object.entries(curated?.meta?.vendors ?? {}));
  if (vendors.size === 0) errors.push('targets.json: meta.vendors must define at least one vendor');
  for (const [key, v] of vendors) {
    if (typeof v?.name !== 'string' || v.name.trim() === '') errors.push(`targets.json: meta.vendors.${key}.name is required`);
  }

  const seenIds = new Set();
  const svcs = Array.isArray(curated?.services) ? curated.services : (errors.push('targets.json: services must be an array'), []);
  svcs.forEach((s, i) => validateService(s, `targets.json services[${i}]`, vendors, errors, seenIds, 'curated'));

  const platforms = curated?.platforms;
  if (platforms !== undefined && !Array.isArray(platforms)) errors.push('targets.json: platforms must be an array');
  for (const [i, p] of (Array.isArray(platforms) ? platforms : []).entries()) {
    const label = `targets.json platforms[${i}]`;
    for (const f of ['id', 'name', 'vendor', 'resultsPath', 'probesFile'])
      if (typeof p?.[f] !== 'string' || p[f].trim() === '') errors.push(`${label}: ${f} is required`);
    if (SLUG.test(p?.id ?? '')) {
      if (seenIds.has(p.id)) errors.push(`${label}: duplicate id "${p.id}"`);
      else seenIds.add(p.id);
    }
    if (!vendors.has(p?.vendor)) errors.push(`${label}: unknown vendor "${p?.vendor}"`);
    if (typeof p?.resultsPath === 'string' && !/^\/results\//.test(p.resultsPath)) errors.push(`${label}: resultsPath must start with /results/`);
  }

  const csvcs = Array.isArray(community?.services) ? community.services : (errors.push('targets-community.json: services must be an array'), []);
  csvcs.forEach((s, i) => validateService(s, `targets-community.json services[${i}]`, vendors, errors, seenIds, 'community'));
  csvcs.forEach((s, i) => { if (s?.tier !== undefined && s.tier !== 'community') errors.push(`targets-community.json services[${i}]: tier must be "community"`); });
  return errors;
}

export function loadRegistries(root = ROOT) {
  const read = (f) => JSON.parse(readFileSync(join(root, 'probe', f), 'utf8'));
  return { curated: read('targets.json'), community: read('targets-community.json') };
}

const ranDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (ranDirectly) {
  try {
    const { curated, community } = loadRegistries();
    const errors = validateRegistries(curated, community);
    if (errors.length > 0) {
      for (const e of errors) console.error(`error: ${e}`);
      process.exit(1);
    }
    console.log(`OK: ${curated.services.length} curated, ${community.services.length} community, ` +
      `${(curated.platforms ?? []).length} platforms, ${Object.keys(curated.meta.vendors).length} vendors`);
  } catch (err) {
    console.error(`error: ${err.message}`);
    process.exit(1);
  }
}
