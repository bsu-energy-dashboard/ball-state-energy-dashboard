import assert from 'node:assert/strict';
import test from 'node:test';
import { getDashboardGuide } from '../src/utils/chatDashboardGuide.ts';

test('overage help returns the dashboard workflow and missing-data caution', () => {
  for (const question of [
    'How do I find overage hours?',
    'Show me how to use threshold detection',
    'Where can I find overage events?',
    'Help me find overages',
  ]) {
    const reply = getDashboardGuide(question);
    assert.match(reply, /Threshold Detection/);
    assert.match(reply, /Event contributions/);
    assert.match(reply, /missing, not zero/);
    assert.match(reply, /not changed your fields or run an analysis/);
  }
});

test('data questions and explicit form commands stay with existing handlers', () => {
  for (const question of [
    'Were there overage events in August?',
    'Set threshold to 22000',
    'How many overage hours were there?',
    'How do I forecast usage?',
    '',
  ]) assert.equal(getDashboardGuide(question), null);
});
