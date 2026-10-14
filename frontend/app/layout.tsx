import type {Metadata} from 'next';
import './tokens.css';
import './fonts.css';
import './marketing.css';
import './globals.css';
import './landing.css';
import './rebuild.css';
import './client-refresh.css';
import './component-refresh.css';
import './tensor-theme.css';
import './ui-layer.css';
import './forms.css';
import './light-surfaces.css';
import './detailed-costs.css';
import {themeInitialization} from '@/lib/theme-initialization';

export const metadata:Metadata={
  metadataBase:new URL('https://green-cost-sydney.vercel.app'),
  title:'GreenCost: Sydney building life-cycle cost comparison (AUD)',
  description:'Compare conventional and sustainable building costs in Sydney, NSW over 30, 40 or 50 years. Transparent estimates, sources and Australian-dollar results.',
  alternates:{canonical:'/'},
  openGraph:{type:'website',locale:'en_AU',url:'/',siteName:'GreenCost Sydney',title:'GreenCost: Sydney building life-cycle cost comparison (AUD)',description:'Compare whole-life building costs in Sydney, NSW with transparent assumptions and sources.'},
  twitter:{card:'summary_large_image',title:'GreenCost Sydney building cost comparison',description:'Compare conventional and sustainable building costs in AUD.',images:['/opengraph-image']},
  icons:{icon:'/favicon.svg'},
};

export default function Layout({children}:{children:React.ReactNode}){
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <head>
        {/* Static bootstrap prevents a theme flash; contains no user-supplied data. */}
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{__html:themeInitialization}}/>
      </head>
      <body>{children}</body>
    </html>
  );
}
