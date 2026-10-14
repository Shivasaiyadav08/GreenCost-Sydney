import {ImageResponse} from 'next/og';

export const alt='GreenCost Sydney: compare whole-life building costs in Australian dollars';
export const size={width:1200,height:630};
export const contentType='image/png';

export default function OpenGraphImage(){
  return new ImageResponse(
    <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:'72px',background:'#f7f8f2',color:'#17251d',fontFamily:'Arial,sans-serif'}}>
      <div style={{display:'flex',alignItems:'center',gap:18,color:'#1f6b4a',fontSize:25,fontWeight:700}}>
        <div style={{width:52,height:52,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:14,background:'#1f6b4a',color:'#fff'}}>
          <span>G</span>
        </div>
        <span>GREEN COST · SYDNEY, NSW</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:22}}>
        <div style={{display:'flex',flexDirection:'column',fontSize:62,fontWeight:700,letterSpacing:-2,lineHeight:1.08}}>
          <span>A longer view of</span>
          <span>what a building costs.</span>
        </div>
        <div style={{display:'flex',fontSize:28,color:'#536259'}}>
          <span>Conventional vs sustainable · 30, 40 and 50 years · AUD</span>
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:21,color:'#536259'}}>
        <span>Transparent assumptions. Sources you can inspect.</span>
        <span>green-cost-sydney.vercel.app</span>
      </div>
    </div>,
    size,
  );
}
