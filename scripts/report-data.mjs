#!/usr/bin/env node
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Pure report-model builder: no I/O, fully unit-testable. Consumed by
// scripts/generate-report.mjs. Pattern follows the Chinaready template
// toolchain (mvp-1/docs/sales/_build): deterministic data layer, separate
// copy layer (scripts/report-copy.mjs), renderer at the edge.

export function summarizeVerdicts(services) {
  const t = { total: services.length, blocked: 0, degraded: 0, reachable: 0 };
  for (const s of services) {
    if (s.verdict === 'Blocked') t.blocked += 1;
    else if (s.verdict === 'Degraded') t.degraded += 1;
    else t.reachable += 1;
  }
  return t;
}

export function diffVerdicts(prevServices, services) {
  prevServices = prevServices || [];
  const prevById = new Map(prevServices.map(s => [s.id, s]));
  const newlyBlocked = [], recovered = [];
  for (const s of services) {
    const p = prevById.get(s.id);
    if (!p) continue; // first appearance is not a change
    if (p.verdict !== 'Blocked' && s.verdict === 'Blocked') newlyBlocked.push(s);
    if (p.verdict === 'Blocked' && s.verdict === 'Reachable') recovered.push(s);
  }
  return { newlyBlocked, recovered };
}

const VERDICT_ORDER = { Blocked: 0, Degraded: 1, Reachable: 2 };

export function buildReportModel({ probe, browser, prev }) {
  const services = (probe.services || []).slice()
    .sort((a, b) => (VERDICT_ORDER[a.verdict] ?? 3) - (VERDICT_ORDER[b.verdict] ?? 3));
  return {
    generatedAt: probe.generatedAt,
    environment: probe.environment || {},
    totals: summarizeVerdicts(probe.services || []),
    changes: diffVerdicts(prev && prev.services, probe.services || []),    services,
    browserFindings: (browser || []).map(f => ({
      name: f.name, verdict: f.verdict, failedCount: (f.failedRequests || []).length
    }))
  };
}
