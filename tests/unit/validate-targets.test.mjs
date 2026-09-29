// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRegistries } from '../../scripts/validate-targets.mjs';

const vendors = { google: { name: 'Google' }, stripe: { name: 'Stripe' } };
const curatedBase = () => ({
  meta: { vendors },
  platforms: [{ id: 'firebase', name: 'Firebase', vendor: 'google',
    resultsPath: '/results/firebase.html', probesFile: 'firebase-latest.json' }],
  services: [{ id: 'google-fonts', name: 'Google Fonts', category: 'fonts',
    categories: ['fonts'], vendor: 'google', tier: 'curated',
    domain: 'fonts.googleapis.com', url: 'https://fonts.googleapis.com/css2',
    demoPath: '/demos/fonts-google.html', symptom: 'fallback typeface' }],
});
const communityBase = () => ({ services: [{ id: 'stripe-js', name: 'Stripe.js',
  category: 'analytics', categories: ['analytics'], vendor: 'stripe',
  tier: 'community', domain: 'js.stripe.com', url: 'https://js.stripe.com/v3/',
  submittedBy: 'octocat', addedAt: '2026-09-29' }] });

test('valid registries produce no errors', () => {
  assert.deepEqual(validateRegistries(curatedBase(), communityBase()), []);
});

test('curated service without demoPath fails', () => {
  const c = curatedBase(); delete c.services[0].demoPath;
  assert.ok(validateRegistries(c, communityBase()).some(e => e.includes('demoPath')));
});

test('community service with demoPath fails', () => {
  const cm = communityBase(); cm.services[0].demoPath = '/demos/stripe.html';
  assert.ok(validateRegistries(curatedBase(), cm).some(e => e.includes('demoPath')));
});

test('community service missing submittedBy or addedAt fails', () => {
  const cm = communityBase(); delete cm.services[0].submittedBy; delete cm.services[0].addedAt;
  const errs = validateRegistries(curatedBase(), cm);
  assert.ok(errs.some(e => e.includes('submittedBy')));
  assert.ok(errs.some(e => e.includes('addedAt')));
});

test('duplicate id across the two files fails', () => {
  const cm = communityBase(); cm.services[0].id = 'google-fonts';
  assert.ok(validateRegistries(curatedBase(), cm).some(e => e.includes('duplicate id')));
});

test('unknown vendor fails (service and platform)', () => {
  const c = curatedBase(); c.services[0].vendor = 'googl';
  assert.ok(validateRegistries(c, communityBase()).some(e => e.includes('unknown vendor "googl"')));
  const c2 = curatedBase(); c2.platforms[0].vendor = 'nope';
  assert.ok(validateRegistries(c2, communityBase()).some(e => e.includes('unknown vendor "nope"')));
});

test('http url, bad slug, bad category, category not in categories all fail', () => {
  const c = curatedBase();
  Object.assign(c.services[0], { url: 'http://x', id: 'Bad_Slug', category: 'payments' });
  const errs = validateRegistries(c, communityBase());
  assert.ok(errs.some(e => e.includes('https://')));
  assert.ok(errs.some(e => e.includes('slug')));
  assert.ok(errs.some(e => e.includes('category "payments"')));
});

test('empty meta.vendors fails; platform missing field fails; bad resultsPath fails', () => {
  const c = curatedBase(); delete c.meta;
  assert.ok(validateRegistries(c, communityBase()).some(e => e.includes('meta.vendors')));
  const c2 = curatedBase(); delete c2.platforms[0].probesFile;
  assert.ok(validateRegistries(c2, communityBase()).some(e => e.includes('probesFile')));
  const c3 = curatedBase(); c3.platforms[0].resultsPath = '/demos/x.html';
  assert.ok(validateRegistries(c3, communityBase()).some(e => e.includes('/results/')));
});

test('community file entry cannot set tier curated', () => {
  const cm = communityBase(); cm.services[0].tier = 'curated';
  assert.ok(validateRegistries(curatedBase(), cm).some(e => e.includes('tier')));
});
