import type {MetadataRoute} from 'next';

const site='https://green-cost-sydney.vercel.app';

export default function sitemap():MetadataRoute.Sitemap{
  return [
    {url:site,lastModified:new Date(),changeFrequency:'monthly',priority:1},
    {url:`${site}/compare`,lastModified:new Date(),changeFrequency:'monthly',priority:0.9},
    {url:`${site}/methodology`,lastModified:new Date(),changeFrequency:'monthly',priority:0.7},
  ];
}
