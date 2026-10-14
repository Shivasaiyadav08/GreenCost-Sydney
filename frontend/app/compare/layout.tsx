import type {Metadata} from 'next';

export const metadata:Metadata={
  title:'Compare conventional vs sustainable building costs in Sydney | GreenCost',
  description:'Compare indicative whole-life building costs in Sydney, NSW. Review the assumptions and results in Australian dollars (AUD).',
  alternates:{canonical:'/compare'},
  openGraph:{title:'Compare building costs in Sydney | GreenCost',description:'Compare indicative whole-life building costs in AUD with assumptions you can inspect.',url:'/compare'},
  twitter:{title:'Compare building costs in Sydney | GreenCost',description:'Compare whole-life costs in AUD with transparent assumptions.'},
};

export default function CompareLayout({children}:{children:React.ReactNode}){
  return children;
}
