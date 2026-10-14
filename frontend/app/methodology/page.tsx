'use client';

import Link from 'next/link';
import {useEffect,useState} from 'react';
import {Layers3} from 'lucide-react';
import Sources from '@/components/Sources';
import ModelAssumptions,{type AssumptionRegister} from '@/components/ModelAssumptions';
import ThemeToggle from '@/components/ThemeToggle';
import {api,type Source} from '@/lib/types';

const sections=[
  {id:'what-this-is',label:'What this tool is'},
  {id:'what-this-is-not',label:'What it is not'},
  {id:'how-costs-work',label:'How costs are calculated'},
  {id:'data-sources',label:'Data sources'},
  {id:'privacy',label:'Privacy'},
  {id:'limitations',label:'Limitations'},
];

export default function Methodology(){
 const [sources,setSources]=useState<Source[]>([]),[assumptions,setAssumptions]=useState<AssumptionRegister|null>(null),[error,setError]=useState(''),[assumptionError,setAssumptionError]=useState('');
 useEffect(()=>{api<Source[]>('/sources').then(setSources).catch(()=>setError('The source register is unavailable. Try again when the calculator is online.'));api<AssumptionRegister>('/v1/assumptions').then(setAssumptions).catch(()=>setAssumptionError('The model assumptions could not load. Reconnect the calculator and refresh this page.'));},[]);
 return <main className="method-page">
  <nav className="method-nav" aria-label="Main navigation">
   <Link href="/" className="gc-brand" aria-label="GreenCost home"><span className="gc-brand-mark" aria-hidden="true"><Layers3 size={17}/></span><span className="gc-brand-word">greencost</span></Link>
   <div><Link href="/compare">Back to your comparison →</Link><ThemeToggle/></div>
  </nav>
  <header className="method-intro">
   <p className="eyebrow">SYDNEY, NSW · METHOD &amp; EVIDENCE</p>
   <h1>A comparison you can inspect.</h1>
   <p>GreenCost compares conventional and sustainable building designs over 30, 40 or 50 years using Sydney reference rates and the assumptions you provide.</p>
  </header>
  <section className="method-summary" aria-labelledby="method-summary-title">
   <h2 id="method-summary-title">What this tool does, and what it needs from you</h2>
   <p>GreenCost compares a conventional and a sustainable specification for the same building, over 30, 40 or 50 years, in today’s Australian dollars. Every figure comes from the inputs you enter and the dated Sydney references listed on this page — nothing is estimated by a black box.</p>
   <p>You will need a few numbers to get a useful result: floor area, a construction budget or quote, and a recent energy and water bill. Without them the comparison still runs, but it relies on assumed rates rather than your building.</p>
   <p><b>It does not</b> provide a construction quote, financial advice, energy rating, or building-code assessment.</p>
  </section>
  <div className="method-layout">
   <nav className="method-toc" aria-label="On this page"><b>On this page</b><ul>{sections.map(section=><li key={section.id}><a href={'#'+section.id}>{section.label}</a></li>)}</ul></nav>
   <div className="method-content">
    <section id="what-this-is">
     <h2>What this tool is</h2>
     <p>GreenCost is a planning comparison for buildings in Sydney, NSW. It compares two specifications for the same building and makes the main cost assumptions visible. Utility costs use the selected Sydney-area references or the rates you enter from your bill.</p>
     <p>All displayed costs use Australian dollars (AUD). Enter construction, supplier and upgrade quotes as GST-inclusive where GST applies. Published residential utility references include GST; enter your own utility rates on the same basis.</p>
    </section>
    <section id="what-this-is-not">
     <h2>What it is not</h2>
     <p>This is an indicative planning and research tool, not a construction quotation, financial recommendation, NatHERS rating or BASIX assessment. Results depend on the inputs and boundaries described here. Upgrade selection alone does not demonstrate compliance or completed-building performance.</p>
    </section>
    <section id="how-costs-work">
     <h2>How costs are calculated</h2>
     <p className="cost-formula"><strong>Total cost over the study period</strong><span>Initial building cost + running and replacement costs + end-of-life costs − recovered-material income</span><small>Future costs and income are converted to today’s value. All amounts are AUD.</small></p>
     <p>Initial costs occur in year zero. Base-year utility prices, maintenance and replacement costs grow at the selected annual rates and are discounted. Replacements occur at the entered intervals before retirement. Disposal and salvage occur at each study endpoint.</p>
     <p>A discount rate gives less weight to costs further in the future. Break-even is the first year when the sustainable design’s cumulative discounted cost becomes no higher than the conventional design’s. It may reverse later, for example after a replacement. Equivalent annual cost spreads present-value cost across the study period using the same discount rate.</p>
     <h3>Two ways to explore upgrades</h3>
     <p><b>Itemised mode</b> adds the installed cost difference of each selected upgrade. Geometry estimates quantities for a rectangular house. Energy effects are applied to specific end uses and combined together, so overlapping savings are not simply added twice.</p>
     <p><b>Research scenarios</b> apply your package premium and operating reductions. Low, mid and high literature-parameter scenarios are available. Usage reductions affect variable utility charges; fixed supply and water service charges remain. These ranges are assumptions, not a promise of whole-life savings.</p>
     <p><b>Historical study inputs</b> reproduce an earlier example, including its original first-year escalation convention and replacement timing. They are retained so older comparisons can be reviewed; they are not a new-house specification. Current scenarios use the current base-year convention.</p>
     <h3>Budgets, quotes and GST</h3>
     <p>A budget range uses its midpoint for the main comparison and recalculates low and high budgets. Generated category allocations and quantities are editable planning estimates, not market benchmarks or a quantity survey. Supplier prices require a clear unit and explicit GST status. Supplied upgrade prices include labour, margin and GST; a comparable installed quote can replace an indicative default. No rebate is applied automatically.</p>
     <h3>What is sourced, and what is estimated?</h3>
     <p>Utility references show the organisation, effective period and source links. Upgrade premiums, end-use splits, geometry, installation quality, solar yield, maintenance and service lives are estimates unless replaced with project evidence. The code-minimum baseline is provisional; required designs depend on the building, location and approval pathway.</p>
     <p>The house take-off assumes a 1.5 plan aspect ratio, 2.7 metre storey height, glazing equal to 18% of floor area and a roof factor of 1.15. Use drawing quantities where available. Solar capacity uses an indicative roof area; rainwater savings are limited by catchment, storage and non-potable demand.</p>
     <details><summary>Energy-model boundaries</summary><p>Baseline electricity is split into heating and cooling, hot water, lighting and appliances using indicative proportions. Insulation, glazing and sealing affect heating demand; HVAC efficiency acts on the remaining demand. Gas is allocated to space heating. The model does not claim fuel-switch savings. If the baseline already has efficient LED lighting, selecting lighting does not reduce modelled electricity. Solar self-use is capped by remaining load; exports earn the entered tariff. Batteries and time-of-use schedules are outside this model.</p></details>
     <details><summary>Pricing and incentives</summary><p>Supplied upgrade prices are installed differences, with labour, margin and GST included. The illustrative low and high ranges are uncertainty assumptions, not live offers. Incentive eligibility and amounts require a dated installer quote; no rebate is applied automatically.</p><p><a href="https://cer.gov.au/schemes/renewable-energy-target/small-scale-renewable-energy-scheme">Federal Small-scale Renewable Energy Scheme</a> and <a href="https://www.energy.nsw.gov.au/households/rebates-grants-and-schemes/household-energy-saving-upgrades/upgrade-your-hot-water">NSW hot-water upgrades</a> have eligibility conditions. Check current requirements with the installer.</p></details>
     <details><summary>Review model assumptions and available features</summary>{assumptions?<ModelAssumptions register={assumptions}/>:<p role="status">{assumptionError||'Loading assumptions…'}</p>}</details>
    </section>
    <section id="data-sources"><h2>Data sources</h2><p>Utility and research references are shown with their organisation, effective or publication dates, and source links. Estimates remain labelled where published project-specific data is unavailable.</p>{error&&<p role="status">{error}</p>}<Sources sources={sources}/></section>
    <section id="privacy">
     <h2>Privacy</h2>
     <p>No accounts or databases are used. Recent comparisons stay in this browser and can be cleared. Downloaded files and share links contain project inputs; share them only with people you choose. Local installations can save JSON reports. Hosted deployments use a read-only research library and keep no durable server history.</p>
     <p>With optional AI enabled, Gemini receives non-identifying scenario facts and selected research excerpts. Tavily receives general building-feature or supplier-product searches. API keys stay on the backend. Provider terms apply to submitted data, so avoid confidential research or personal information. Turning off web research skips Tavily; hosted AI is disabled by default.</p>
    </section>
    <section id="limitations">
     <h2>Limitations</h2>
     <p>Verify assumptions with your builder, quantity surveyor and energy assessor before making a building decision. Site conditions, excavation, bushfire and flood requirements, orientation, shading, network approvals and installation quality need project-specific assessment. Tariffs can change; check the current source before relying on an older saved comparison.</p>
     <p className="method-disclaimer">Indicative planning tool. Not a quotation, financial advice, or a NatHERS/BASIX assessment.</p>
     <p><Link href="/compare">Create your comparison →</Link></p>
    </section>
   </div>
  </div>
  <footer className="method-footer"><Link href="/">GreenCost</Link><Link href="/methodology#privacy">Privacy</Link><Link href="/compare">Compare</Link><small>Sydney, NSW · costs in AUD</small></footer>
 </main>;
}
