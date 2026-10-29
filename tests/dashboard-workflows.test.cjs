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
const { formatStatistic } = load('src/utils/formatStatistic.ts');
const { buildSeasonalTemperatureBody } = load('src/utils/apiManualOutliers.ts');
test('missing statistics are displayed safely without hiding valid zero readings', () => {
 for (const value of [null, undefined, NaN, Infinity]) assert.equal(formatStatistic(value), '—');
 assert.equal(formatStatistic(0), '0.00');
});
test('zap replacement selection reaches analysis and changes its cache key', () => {
 const average = build('temperature-analysis', {outlierZapMode:'this_tab', manualOutliers:{'TEST.APT':['2026-07-01T12:00:00']}, manualOutlierReplacement:'average'}).params;
 const zero = {...average, manual_outlier_replacement:'zero'};
 assert.equal(buildSeasonalTemperatureBody(zero).manual_outlier_replacement, 'zero');
 assert.notDeepEqual(analysisQueryKey('temperature-analysis', average), analysisQueryKey('temperature-analysis', zero));
});
const { retainedReadingStats, samePreviewSource } = load('src/utils/outlierZapChart.ts');
test('zap summary immediately excludes spikes and restores them on undo', () => {
 const series = [10,9999,30].map((value, i) => ({datetime:`2026-01-01T0${i}:00:00`,value}));
 assert.equal(retainedReadingStats(series, [series[1].datetime]).max, 30);
 assert.equal(retainedReadingStats(series, [series[1].datetime]).count, 2);
 assert.equal(retainedReadingStats(series, []).max, 9999);
 assert.equal(retainedReadingStats(series, series.map(p=>p.datetime)).max, null);
});
test('zap refresh retains chart only for the same data source', () => {
 const key = ['outlier-preview','start','end','meter',undefined,{meter:['one']}];
 assert.equal(samePreviewSource(key, [...key.slice(0,5),{meter:['two']}]), true);
 assert.equal(samePreviewSource(key, ['outlier-preview','start','end','other',undefined]), false);
 assert.equal(samePreviewSource(key, ['outlier-preview','new-start','end','meter',undefined]), false);
});
const { defaultCleaningMethod, cleaningMethodOptionsForPlot, CLEANING_DESCRIPTIONS } = load('src/constants/cleaningMethods.ts');
test('every plot has an available cleaning default and descriptions', () => {
 for (const plot of ['usage-history','seasonal-analysis','temperature-analysis','time-series','eda-plots','rpca-analysis','threshold-detection']) {
  const method = defaultCleaningMethod(plot);
  assert.ok(cleaningMethodOptionsForPlot(plot).some(option => option.value === method));
  const r = build(plot, {cleaningMethod:method});
  if (r.ok) assert.equal(r.params.cleaning_method, method);
  for (const option of cleaningMethodOptionsForPlot(plot)) {
   assert.ok(option.label.includes(' - '));
   assert.ok(CLEANING_DESCRIPTIONS[option.value]);
  }
 }
 assert.equal(defaultCleaningMethod('temperature-analysis'), 'Hampel');
 assert.equal(defaultCleaningMethod('eda-plots'), 'Polynomial');
});
const { zapBaselineRequest } = load('src/utils/outlierZapChart.ts');
test('zap selection uses an automatic-only baseline and raw data when cleaning is off', () => {
 const request = {start_date:'2026-01-01',end_date:'2026-01-03',meter:'m',cleaning_method:'Hampel',manual_outliers:{m:['2026-01-02']}};
 const baseline = zapBaselineRequest(request);
 assert.equal(baseline.include_cleaned_preview,true);
 assert.equal(baseline.manual_outliers,undefined);
 assert.deepEqual(baseline,zapBaselineRequest({...request,manual_outliers:{m:['2026-01-01']}}));
 assert.equal(zapBaselineRequest({...request,cleaning_method:undefined}).include_cleaned_preview,false);
 const {outlierPreviewQueryKey} = load('src/utils/analysisQueryKeys.ts');
 assert.equal(samePreviewSource(outlierPreviewQueryKey(baseline),outlierPreviewQueryKey({...baseline,cleaning_method:'Polynomial'})),false);
});
