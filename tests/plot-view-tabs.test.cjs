const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const mod={exports:{}};
const code=ts.transpileModule(fs.readFileSync('src/components/PlotViewTabs.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
new Function('require','module','exports',code)(require,mod,mod.exports);
const Tabs=mod.exports.default;
test('charts default to interactive and keep image switch available',()=>{
 const html=renderToStaticMarkup(React.createElement(Tabs,{image:'png',title:'Seasonal'},React.createElement('div',null,'Interactive chart')));
 assert.match(html,/aria-selected="true"[^>]*>Interactive/);
 assert.match(html,/Interactive chart/);
 assert.doesNotMatch(html,/<img/);
 assert.match(html,/>Image<\/button>/);
});
test('older API results fall back to their preserved image',()=>{
 const html=renderToStaticMarkup(React.createElement(Tabs,{image:'png',title:'Decomposition'}));
 assert.match(html,/src="data:image\/png;base64,png"/);
 assert.match(html,/disabled=""/);
 assert.match(html,/Interactive data is not available/);
});
