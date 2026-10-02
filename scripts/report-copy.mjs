#!/usr/bin/env node
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Centralized report copy + governance, following the Chinaready template
// toolchain pattern (mvp-1/docs/sales/_build/copy.mjs): all strings live here,
// scanReportCopy() enforces wording discipline, and unit tests lock it in.
// The lab's evidence voice: measured, no promises, always hedged as a snapshot.

export const COPY = {
  cover: {
    eyebrow: 'Weekly evidence report',
    titleBeforePeriod: 'Stack Break Weekly',
    subtitle: 'Which foreign web-stack dependencies reached a Beijing node this week.',
    site: 'stackbreak.launchready.cn',
    operatedBy: 'Operated by Chinaready · evidence from mainland China infrastructure',
  },
  sections: {
    summaryHeading: 'Executive summary',
    servicesHeading: 'Verdicts by dependency',
    browserHeading: 'Browser findings',
    shotsHeading: 'What a blocked page looks like',
    cnHeading: '中文摘要',
  },
  labels: {
    runDate: 'Run date',
    node: 'Node',
    dns: 'DNS',
    newlyBlocked: 'Newly blocked this week',
    recovered: 'Recovered this week',
    noChanges: 'No verdict changes against the previous archived run.',
    colorCode: 'Verdict color code — Reachable < 1s · Degraded 1–3s · Blocked > 3s or connection failed. Measured as total request time from the Beijing node; any HTTP status counts as connected.',
    service: 'Dependency',
    tier: 'Tier',
    category: 'Category',
    vendor: 'SaaS',
    domain: 'Domain',
    http: 'HTTP',
    total: 'Total (s)',
    dnsCol: 'DNS',
    failedRequests: 'Failed requests',
  },
  disclaimer:
    'Single-node snapshot from one Beijing run. Verdicts vary by carrier, region, and time. ' +
    'This is measurement evidence, not a legal or compliance conclusion.',
  cn: {
    lede: '本页为中文摘要。Stack Break Lab 每周从北京节点实测境外 Web 技术栈依赖在中国大陆的可达性。',
    totals: '本期共测 {total} 项：可达 {reachable}、降速 {degraded}、阻断 {blocked}。',
    changes: '与上一期归档相比：新被墙 {newlyBlocked} 项，恢复 {recovered} 项。',
    environment: '测试环境：{cloudProvider} {cloudRegion}（{runnerHost}），DNS {dnsServer}。',
    disclaimer: '免责声明：本报告为单节点（北京）单次快照，结果随运营商、地区与时间变化；本报告是测量证据，不构成法律或合规结论。',
    readMore: '完整明细与历史数据见 stackbreak.launchready.cn。',
  },
};

const POSITIVE_PROMISE = /\b(?:we\s+|always\s+)?guarante?e[ds]?\b|\balways\s+(?:available|accessible|reachable)\b|\b100%\s+(?:uptime|accessible|available)\b|\bSLA\b/i;

export function scanReportCopy(copy = COPY) {
  const errors = [];
  const enStrings = JSON.stringify({
    cover: copy.cover, sections: copy.sections, labels: copy.labels, disclaimer: copy.disclaimer,
  });
  if (POSITIVE_PROMISE.test(enStrings)) errors.push('positive guarantee or SLA wording in EN copy');
  if (!enStrings.includes(copy.disclaimer.slice(0, 30))) errors.push('disclaimer missing');
  if (!copy.cn.disclaimer.includes('不构成')) errors.push('CN disclaimer missing its non-conclusion clause');
  return { ok: errors.length === 0, errors };
}

export function fillCnTemplate(model, copy = COPY) {
  return {
    lede: copy.cn.lede,
    totals: copy.cn.totals
      .replace('{total}', String(model.totals.total))
      .replace('{reachable}', String(model.totals.reachable))
      .replace('{degraded}', String(model.totals.degraded))
      .replace('{blocked}', String(model.totals.blocked)),
    changes: copy.cn.changes
      .replace('{newlyBlocked}', String(model.changes.newlyBlocked.length))
      .replace('{recovered}', String(model.changes.recovered.length)),
    environment: copy.cn.environment
      .replace('{cloudProvider}', model.environment.cloudProvider || 'unknown')
      .replace('{cloudRegion}', model.environment.cloudRegion || '')
      .replace('{runnerHost}', model.environment.runnerHost || '')
      .replace('{dnsServer}', model.environment.dnsServer || ''),
    disclaimer: copy.cn.disclaimer,
    readMore: copy.cn.readMore,
  };
}
