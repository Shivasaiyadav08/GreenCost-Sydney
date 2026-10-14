import type {Metadata} from 'next';

export const metadata:Metadata={
  title:'Method and evidence | GreenCost Sydney',
  description:'Read how GreenCost compares building life-cycle costs in Sydney, NSW, including AUD assumptions, source dates, privacy and limitations.',
  alternates:{canonical:'/methodology'},
  openGraph:{title:'Method and evidence | GreenCost Sydney',description:'Understand GreenCost methods, AUD assumptions, data sources, privacy and limitations.',url:'/methodology'},
  twitter:{title:'Method and evidence | GreenCost Sydney',description:'GreenCost methods, data sources, privacy and limitations.'},
};

export default function MethodologyLayout({children}:{children:React.ReactNode}){
  return children;
}
