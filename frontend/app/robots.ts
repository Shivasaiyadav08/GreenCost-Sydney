import type {MetadataRoute} from 'next';

export default function robots():MetadataRoute.Robots{
  return {
    rules:{userAgent:'*',allow:'/',disallow:'/api/'},
    sitemap:'https://green-cost-sydney.vercel.app/sitemap.xml',
  };
}
