'use client';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, ArrowUpRight, BookOpen, Check, Globe2, Layers3, Leaf,
} from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import LandingScene from '@/components/LandingScene';
import PaybackChart from '@/components/PaybackChart';

const STEPS = [
  {
    title: 'Describe your building',
    body: 'Area, storeys, utilities and the budget you are working to. Apartment blocks adjust the area and occupant figures for you.',
  },
  {
    title: 'Choose the upgrades in view',
    body: 'Insulation, glazing, hot water, lighting and the rest — each with a rated cost and the service life it is assumed to deliver.',
  },
  {
    title: 'Compare across the study period',
    body: 'Conventional against sustainable over 30, 40 or 50 years, with running costs, replacements and maintenance included.',
  },
];

const STRIP = [
  {icon: BookOpen,   title: 'A research library',        body: 'Sydney reference rates with sources. Other estimates are clearly labelled.'},
  {icon: Globe2,     title: 'NSW context built in',       body: 'Ausgrid tariffs, Sydney water pricing and local construction rates.'},
  {icon: Leaf,       title: 'Assumptions you can open',   body: 'Every discount rate, escalation and service life is visible and editable.'},
];

// Figures below are GreenCost's own offline 40-year sample for the bundled
// Sydney courtyard house demo. They are illustrative model output, not a quote.
const SAMPLE = {
  building: 'Sydney courtyard house',
  detail: '250 m² · 2 storeys · Ausgrid · 5% discount',
  conventional: 'A$961,153',
  sustainable: 'A$936,347',
  saving: 'A$24,805',
  premium: 'A$12,981',
  payback: 'Year 10',
  savingShare: `${(24_805 / 961_153 * 100).toFixed(1)}%`,
};

export default function Home(){
  const router = useRouter();

  useEffect(()=>{
    if(new URLSearchParams(window.location.search).has('project')){
      router.replace('/compare' + window.location.search);
    }
  }, [router]);

  return (
    <div className="gc">
      <SiteHeader/>
      <a className="gc-skip" href="#how-it-works">Skip to content</a>

      <main>
        {/* ---- Hero ---- */}
        <section className="gc-shell gc-hero">
          <div>
            <span className="gc-eyebrow">Sydney building economics</span>

            <h1>
              Build better.<br/>
              Spend <em>smarter.</em>
            </h1>

            <p className="gc-hero-lede">
              A longer view of what a building actually costs.
            </p>

            <p className="gc-hero-body">
              Compare conventional and sustainable construction over 30, 40 and
              50 years. Running costs, replacements and maintenance included,
              with the assumptions left open for you to challenge.
            </p>

            <div className="gc-hero-actions">
              <button className="gc-btn gc-btn-primary" onClick={()=>router.push('/compare')}>
                Start comparison <ArrowUpRight size={16}/>
              </button>
              <button className="gc-btn gc-btn-secondary" onClick={()=>router.push('/compare?sample=1')}>
                Explore a sample <ArrowRight size={15}/>
              </button>
            </div>

            <div className="gc-trust">
              <span><Check size={14}/> Sydney reference rates with sources</span>
              <span><Check size={14}/> Discount rate and escalation editable</span>
            </div>
          </div>

          <div className="gc-panel">
            <div className="gc-panel-head">
              <span>Your building</span>
              <span className="gc-panel-tag"><i/>Live model</span>
            </div>
            <LandingScene/>
          </div>
        </section>

        {/* ---- Evidence strip ---- */}
        <section className="gc-strip">
          <div className="gc-strip-grid">
            {STRIP.map(({icon:Icon, title, body})=>(
              <div key={title}>
                <Icon size={19}/>
                <div>
                  <b>{title}</b>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---- How it works ---- */}
        <section className="gc-shell gc-section" id="how-it-works">
          <div className="gc-section-head gc-section-head--split">
            <div>
              <span className="gc-eyebrow">How it works</span>
              <h2>A few inputs, a longer outlook.</h2>
              <p>
                No spreadsheet to assemble. Describe the building, set what you
                are considering, and read the trade-offs across the years.
              </p>
            </div>

            <PaybackChart/>
          </div>

          <div className="gc-steps">
            {STEPS.map(s=>(
              <article key={s.title} className="gc-step">
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ---- Worked example, using GreenCost's own sample output ---- */}
        <section className="gc-example">
          <div className="gc-shell gc-section gc-example-grid">
            <div>
              <span className="gc-eyebrow">Worked example</span>
              <h2>What a forty-year view can change.</h2>
              <p className="gc-example-lede">
                A sustainable fit-out costs more on day one. Whether that pays
                back depends entirely on how long you intend to hold the
                building — which is the number most comparisons never show you.
              </p>

              <dl className="gc-example-facts">
                <div>
                  <dt>Study period</dt>
                  <dd>40 years</dd>
                </div>
                <div>
                  <dt>Premium recovered</dt>
                  <dd>{SAMPLE.payback}</dd>
                </div>
              </dl>
            </div>

            <div className="gc-outcome">
              <div className="gc-outcome-head">
                <span>{SAMPLE.building}</span>
                <span>{SAMPLE.detail}</span>
              </div>

              <dl className="gc-outcome-rows">
                <div>
                  <dt>Conventional — whole-life cost</dt>
                  <dd>{SAMPLE.conventional}</dd>
                </div>
                <div>
                  <dt>Sustainable — whole-life cost</dt>
                  <dd>{SAMPLE.sustainable}</dd>
                </div>
                <div className="is-save">
                  <dt>Net saving over the period</dt>
                  <dd>{SAMPLE.saving} <small>({SAMPLE.savingShare} of the conventional total)</small></dd>
                </div>
                <div>
                  <dt>Additional cost on day one</dt>
                  <dd>{SAMPLE.premium}</dd>
                </div>
              </dl>

              <p className="gc-outcome-note">
                Illustrative output from the bundled demo building using Sydney
                reference rates. Not a quotation — adjust any input in the
                calculator and the comparison updates.
              </p>
            </div>
          </div>
        </section>

        <section className="gc-shell gc-section gc-faq" aria-labelledby="faq-title">
          <div className="gc-faq-heading">
            <span className="gc-eyebrow">COMMON QUESTIONS</span>
            <h2 id="faq-title">Before you compare.</h2>
            <p>What the Sydney estimate can show, and where a builder or assessor is still needed.</p>
          </div>
          <div className="gc-faq-list">
            <details><summary>What does the discount rate mean?</summary><p>It converts future costs into today’s equivalent dollars. The comparison lets you adjust it because there is no single rate that suits every project.</p></details>
            <details><summary>Is break-even the same as the lowest whole-life cost?</summary><p>No. Break-even is the first year discounted cumulative costs cross. Whole-life cost is the total at your chosen study-period end, so the advantage can later narrow or reverse.</p></details>
            <details><summary>Are rebates included?</summary><p>No rebates are assumed automatically. Add a confirmed incentive only when it applies to your project, and check whether your quotes already include it.</p></details>
            <details><summary>Is this a BASIX or NatHERS assessment?</summary><p>No. GreenCost is an indicative cost-planning comparison. It does not assess compliance or replace a qualified assessor, certifier or builder.</p></details>
            <details><summary>What does “sustainable” mean here?</summary><p>It means the features and performance assumptions you select for this comparison. The tool reports the modelled cost effects; it does not claim a complete environmental or carbon assessment.</p></details>
          </div>
        </section>

        {/* ---- Close
             Method and the closing call to action are both "next step" blocks.
             Stacked as two full sections they left roughly 160px of empty
             space between a link and the heading under it, because neither
             has enough content to justify a section of its own. Side by side
             they fill the width and read as one closing band. ---- */}
        <section className="gc-shell gc-section gc-close">
          <div className="gc-close-grid">
            <div className="gc-close-lead">
              <Leaf size={22}/>
              <h2>Better buildings start with a longer view.</h2>
              <button className="gc-btn gc-btn-primary" onClick={()=>router.push('/compare')}>
                Take the first step <ArrowUpRight size={16}/>
              </button>
            </div>

            <div className="gc-close-aside">
              <span className="gc-eyebrow">Method &amp; evidence</span>
              <h3>Know what sits behind the numbers.</h3>
              <p>
                Sydney reference rates, the discounting method, the research
                sources and the limits of the model — written out rather than
                buried.
              </p>
              <Link href="/methodology" className="gc-btn gc-btn-quiet">
                Explore method &amp; evidence <ArrowUpRight size={15}/>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="gc-footer">
        <div className="gc-shell gc-footer-row">
          <Link href="/" className="gc-brand">
            <span className="gc-brand-mark" aria-hidden="true"><Layers3 size={16}/></span>
            <span className="gc-brand-word">greencost</span>
          </Link>
          <Link href="/methodology">Method &amp; evidence</Link>
          <Link href="/methodology#privacy">Privacy</Link>
          <Link href="/compare">Calculator</Link>
          <small>Indicative planning tool · Costs in AUD</small>
        </div>
      </footer>
    </div>
  );
}
