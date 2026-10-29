// Exercise the real TypeScript request builders without a browser or a new test dependency.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} }; cache.set(file, mod);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  new Function('require', 'module', 'exports', code)((name) => {
    if (name === 'react-toastify') return { toast: { error() {}, warn() {} } };
    return name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name);
  }, mod, mod.exports);
  return mod.exports;
}
const { buildBaseRequest } = load('src/utils/parameter-form/buildBaseRequest.ts');
const { analysisQueryKey, timeSeriesQueryKey } = load('src/utils/analysisQueryKeys.ts');
const { applyDatePreset } = load('src/utils/parameter-form/applyDatePreset.ts');
const { EXPLORATION_OPTIONS } = load('src/constants/exploration.ts');
const base = {
 startDate: '2026-01-01T00:00', endDate: '2026-07-31T23:00', meter: 'TEST.APT',
 cleaningMethod: '', smoothingMethod: '', cleaningExtra: {}, forecast: false,
 assessment: false, testHours: 168, forecastModel: 'Prophet', features: [],
 includedMeters: [], seriesMeters: [], outlierZapMode: 'none', manualOutliers: {},
 edaRoute: 'trend-tests', edaSeasonalPeriods: 24,
};
const build = (plot, overrides = {}) => buildBaseRequest({state: {...base, ...overrides}, selectedPlotType: plot, shouldShowField: () => true, meterGroups: []});
test('recorded usage cannot accidentally forecast or assess, and does not smooth by default', () => {
 const r = build('usage-history', {forecast: true, assessment: true});
 assert.equal(r.ok, true); assert.equal(r.params.forecast, false); assert.equal(r.params.assessment, false);
 assert.equal(r.params.smoothing_method, undefined);
 assert.deepEqual(analysisQueryKey('usage-history', r.params), timeSeriesQueryKey(r.params));
});
test('forecast tab always chooses exactly one prediction mode', () => {
 for (const assessment of [false, true]) {
  const r = build('time-series', {assessment, forecast: true});
  assert.equal(r.ok, true); assert.equal(r.params.forecast, !assessment); assert.equal(r.params.assessment, assessment);
 }
});
test('accuracy checks leave some history for training', () => {
 assert.equal(build('time-series', {assessment: true, testHours: 8760}).ok, false);
 assert.equal(build('time-series', {testHours: 0}).ok, false);
 assert.equal(build('time-series', {testHours: 1.5}).ok, false);
});
test('exploration destinations retain their backend routes', () => {
 assert.ok(EXPLORATION_OPTIONS.some(o => o.plot === 'usage-history'));
 for (const plot of ['seasonal-analysis', 'temperature-analysis', 'eda-plots']) {
  const r = build(plot); assert.equal(r.ok, true);
  assert.equal(analysisQueryKey(plot, r.params)[0], plot === 'eda-plots' ? 'eda-plot' : plot);
 }
});
test('latest date ranges preserve local dataset time rather than shifting to UTC', () => {
 const dates = applyDatePreset('week', '2026-07-31T23:00');
 assert.deepEqual(dates, {startDate: '2026-07-24T23:00', endDate: '2026-07-31T23:00'});
});
test('manual corrections survive the moved usage chart', () => {
 const r = build('usage-history', {outlierZapMode:'this_tab', manualOutliers:{'TEST.APT':['2026-07-01T12:00:00']}});
 assert.deepEqual(r.params.manual_outliers, {'TEST.APT':['2026-07-01T12:00:00']});
});
