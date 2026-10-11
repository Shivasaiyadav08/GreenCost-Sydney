'use client';
import {useEffect,useMemo,useState,type ReactNode} from 'react';
import {Canvas} from '@react-three/fiber';
import {ContactShadows,OrbitControls} from '@react-three/drei';
import * as THREE from 'three';
import {Droplet,Layers,Sun} from 'lucide-react';
import {scenePalette} from '@/lib/scene-palette';

/**
 * Modern two-storey exterior for the empty comparison state, with a broad
 * solar roof, stepped lower wing, full-height glazing, entry canopy and a
 * restrained planted garden.
 *
 * The palette is deliberately theme-independent — the model depicts daylight
 * whether the page around it is light or dark, matching the landing hero.
 * No image assets; all geometry is procedural.
 *
 * Renders `fallback` (the 2D section drawing) while WebGL capability is being
 * checked and wherever it is unavailable, so the drawing is never lost.
 */

function Box({position, size, color, glass = false, roughness}:{
  position:[number,number,number];
  size:[number,number,number];
  color:string;
  glass?:boolean;
  roughness?:number;
}){
  return (
    <mesh position={position} castShadow={!glass} receiveShadow>
      <boxGeometry args={size}/>
      <meshStandardMaterial
        color={color}
        roughness={glass ? 0.16 : roughness ?? 0.82}
        metalness={glass ? 0.35 : 0}
        envMapIntensity={glass ? 1.2 : 0.4}
      />
    </mesh>
  );
}

function HeroTree({position, scale = 1}:{position:[number,number,number]; scale?:number}){
  const p = useMemo(()=>scenePalette(),[]);
  const blobs: Array<[number,number,number,number,boolean]> = [
    [0,2.6,0,.85,true],
    [.75,2.3,.25,.6,false],
    [-.7,2.4,-.2,.62,true],
    [.25,3.1,-.3,.55,false],
    [-.3,3.0,.35,.5,true],
    [.9,2.8,-.35,.45,false],
    [-.85,2.75,.3,.44,true],
    [0,3.45,0,.5,false],
  ];
  return (
    <group position={position} scale={scale}>
      <mesh position={[0,1.1,0]} castShadow>
        <cylinderGeometry args={[.09,.13,2.2,8]}/>
        <meshStandardMaterial color={p.trunk} roughness={.95}/>
      </mesh>
      <mesh position={[.45,1.7,.15]} rotation={[0,0,-.5]} castShadow>
        <cylinderGeometry args={[.05,.07,1.2,6]}/>
        <meshStandardMaterial color={p.trunk} roughness={.95}/>
      </mesh>
      {blobs.map(([x,y,z,r,light],i)=>(
        <mesh key={i} position={[x,y,z]} castShadow>
          <icosahedronGeometry args={[r,1]}/>
          <meshStandardMaterial color={light?p.foliageLight:p.foliageDark} flatShading roughness={.9}/>
        </mesh>
      ))}
    </group>
  );
}

function House(){
  const p = useMemo(()=>scenePalette(),[]);
  const roofWedge = useMemo(()=>{
    const shape = new THREE.Shape();
    shape.moveTo(1.725,4.65);
    shape.lineTo(-1.725,4.65);
    shape.lineTo(-1.725,4.83);
    shape.lineTo(1.725,5.58);
    shape.closePath();
    return shape;
  },[]);

  return (
    <group>
      {/* A crisp white display plinth with a simple planted garden. */}
      <Box position={[0,.04,0]} size={[13,.42,9.4]} color="#fdfdfb" roughness={.9}/>
      <Box position={[0,.28,0]} size={[12.55,.08,8.95]} color={p.lawn} roughness={.95}/>

      {/* Main two-storey white volume. */}
      <Box position={[0,1.62,-.05]} size={[5.8,2.65,3.9]} color="#fbfbf8" roughness={.82}/>
      <Box position={[0,3.78,-.1]} size={[4.95,1.75,3.45]} color="#ffffff" roughness={.82}/>
      <Box position={[0,.39,0]} size={[6.05,.16,4.1]} color="#ffffff"/>

      {/* Sloped white infill closes the space beneath the pitched roof on both sides. */}
      {[-2.48,2.48].map(x=>(
        <mesh key={'roof-infill-'+x} position={[x,0,-.1]} rotation={[0,Math.PI/2,0]}>
          <shapeGeometry args={[roofWedge]}/>
          <meshStandardMaterial color="#ffffff" roughness={.82} side={THREE.DoubleSide}/>
        </mesh>
      ))}
      <Box position={[0,4.77,1.66]} size={[4.95,.24,.13]} color="#ffffff" roughness={.82}/>
      <Box position={[0,5.14,-1.82]} size={[4.95,.98,.13]} color="#ffffff" roughness={.82}/>

      {/* Full-height front glazing, divided by fine dark mullions. */}
      <mesh position={[0,1.62,1.93]}>
        <boxGeometry args={[4.75,1.92,.045]}/>
        <meshStandardMaterial color="#8faea6" roughness={.12} metalness={.14} transparent opacity={.56} depthWrite={false}/>
      </mesh>
      <mesh position={[0,3.82,1.68]}>
        <boxGeometry args={[4.3,1.25,.045]}/>
        <meshStandardMaterial color="#8faea6" roughness={.12} metalness={.14} transparent opacity={.48} depthWrite={false}/>
      </mesh>
      {[-2.25,-1.15,0,1.15,2.25].map(x=>(
        <Box key={'lower-mullion-'+x} position={[x,1.62,1.97]} size={[.055,1.95,.065]} color="#46534f" roughness={.55}/>
      ))}
      {[-1.45,0,1.45].map(x=>(
        <Box key={'upper-mullion-'+x} position={[x,3.82,1.72]} size={[.055,1.28,.065]} color="#46534f" roughness={.55}/>
      ))}
      <Box position={[0,2.62,1.98]} size={[5.82,.12,.15]} color="#ffffff"/>
      <Box position={[0,3.09,1.98]} size={[4.85,.08,.1]} color="#ffffff"/>
      <Box position={[0,4.48,1.73]} size={[5.25,.14,.13]} color="#ffffff"/>

      {/* A lower wing to the left creates the stepped silhouette from the reference. */}
      <Box position={[-4.0,1.12,.1]} size={[2.45,1.75,3.5]} color="#ffffff" roughness={.82}/>
      <Box position={[-4.0,2.06,.1]} size={[2.68,.16,3.75]} color="#ffffff"/>
      <mesh position={[-4.0,1.22,1.87]}>
        <boxGeometry args={[1.65,1.1,.04]}/>
        <meshStandardMaterial color="#9ab4aa" roughness={.15} transparent opacity={.48} depthWrite={false}/>
      </mesh>
      {[-4.65,-3.85].map(x=>(
        <Box key={'wing-frame-'+x} position={[x,1.22,1.9]} size={[.055,1.14,.06]} color="#59635e" roughness={.6}/>
      ))}

      {/* Deep charcoal pitched roof with a generous blue solar array. */}
      <group position={[0,5.33,-.08]} rotation={[.22,0,0]}>
        <Box position={[0,0,0]} size={[6.55,.16,4.75]} color="#35434a" roughness={.72}/>
        <Box position={[0,.105,.02]} size={[4.95,.045,3.45]} color="#173c58" roughness={.22}/>
        {[-1.86,-.62,.62,1.86].map(x=>(
          <Box key={'panel-v-'+x} position={[x,.14,.02]} size={[.025,.02,3.38]} color="#91b5c7" roughness={.35}/>
        ))}
        {[-1.12,0,1.12].map(z=>(
          <Box key={'panel-h-'+z} position={[0,.14,z]} size={[4.9,.02,.025]} color="#91b5c7" roughness={.35}/>
        ))}
        {[-1.86,-.62,.62,1.86].flatMap(x=>
          [-1.12,0,1.12].map(z=>(
            <mesh key={'cell-'+x+'-'+z} position={[x,.135,z]}>
              <boxGeometry args={[1.16,.018,1.04]}/>
              <meshStandardMaterial color="#16405f" roughness={.2} metalness={.2}/>
            </mesh>
          ))
        )}
      </group>
      <Box position={[0,4.73,2.05]} size={[6.7,.13,.14]} color="#e9ece9" roughness={.65}/>

      {/* Fine porch canopy and two slim support posts. */}
      <Box position={[1.45,2.72,2.95]} size={[3.25,.12,1.45]} color="#ffffff" roughness={.72}/>
      {[.1,2.8].map(x=>(
        <Box key={'porch-post-'+x} position={[x,1.54,3.5]} size={[.09,2.35,.09]} color="#ffffff" roughness={.72}/>
      ))}
      <Box position={[1.42,.42,3.05]} size={[3.1,.08,1.65]} color={p.driveway} roughness={.9}/>
      {[.35,1.25,2.15].map(x=>(
        <Box key={'entry-step-'+x} position={[x,.38,2.35]} size={[.82,.08,.45]} color="#ffffff" roughness={.85}/>
      ))}

      {/* A quiet path and low garden beds frame the house. */}
      <Box position={[0,.34,4.1]} size={[4.2,.06,.7]} color="#e9e7e0" roughness={.92}/>
      <Box position={[-4.45,.36,3.1]} size={[2.35,.1,.72]} color="#82936d" roughness={.95}/>
      <Box position={[4.5,.36,2.55]} size={[2.3,.1,.72]} color="#82936d" roughness={.95}/>
      {[[-4.9,.65,3.1,.24],[-4.25,.62,3.15,.3],[-3.72,.6,3.08,.22],[4.0,.62,2.55,.25],[4.55,.68,2.6,.32],[5.05,.62,2.55,.23],[1.5,.58,4.2,.2],[-1.6,.57,4.2,.18]].map(([x,y,z,r],i)=>(
        <mesh key={'shrub-'+i} position={[x,y,z]} castShadow>
          <icosahedronGeometry args={[r,1]}/>
          <meshStandardMaterial color={i%2?p.foliageDark:p.foliageLight} flatShading roughness={.9}/>
        </mesh>
      ))}
      <HeroTree position={[-5.2,.34,-1.0]} scale={1.22}/>
      <HeroTree position={[5.25,.34,-1.5]} scale={.82}/>

      {/* Rainwater tank remains visible as one of the featured upgrades. */}
      <mesh position={[-5.1,.92,2.5]} castShadow receiveShadow>
        <cylinderGeometry args={[.34,.34,1.1,24]}/>
        <meshStandardMaterial color={p.tank} roughness={.72}/>
      </mesh>
      <mesh position={[-5.1,1.49,2.5]}>
        <cylinderGeometry args={[.36,.36,.06,24]}/>
        <meshStandardMaterial color="#71877b" roughness={.68}/>
      </mesh>
      <Box position={[-4.74,.82,2.5]} size={[.16,.1,.1]} color={p.tank} roughness={.7}/>

      {/* Small timber doghouse in the open front-right garden. */}
      <group position={[4.55,.34,4.05]}>
        <Box position={[0,.36,0]} size={[.94,.68,.78]} color="#b8895b" roughness={.9}/>
        <Box position={[0,.28,.4]} size={[.42,.5,.035]} color="#3e3932" roughness={.95}/>
        <mesh position={[-.25,.76,0]} rotation={[0,0,-.45]} castShadow>
          <boxGeometry args={[.64,.09,.96]}/>
          <meshStandardMaterial color="#596158" roughness={.85}/>
        </mesh>
        <mesh position={[.25,.76,0]} rotation={[0,0,.45]} castShadow>
          <boxGeometry args={[.64,.09,.96]}/>
          <meshStandardMaterial color="#596158" roughness={.85}/>
        </mesh>
        <Box position={[0,.055,.52]} size={[1.12,.08,1.06]} color="#e4dccb" roughness={.92}/>
      </group>
    </group>
  );
}
function Chips(){
  /* Locked to the light treatment in both page themes. The stage renders
     daylight whether the page is light or dark, so the chips match the scene,
     not the page — otherwise a dark page turns the chips dark and the forest
     icons disappear into them. Values mirror the light theme tokens. */
  const card: React.CSSProperties = {
    background:'#ffffff', color:'#141211',
    border:'0.5px solid rgba(20,18,17,0.1)',
  };
  const icon: React.CSSProperties = {background:'#e6f0e9', color:'#1d6a4b'};
  const sub: React.CSSProperties = {color:'#6e6b64'};
  const chip = (iconNode:ReactNode, title:string, subText:string, style:React.CSSProperties)=>(
    <div className="gc-note" style={{...style, ...card, pointerEvents:'none'}}>
      <span className="gc-note-icon" style={icon}>{iconNode}</span>
      <div><b>{title}</b><small style={sub}>{subText}</small></div>
    </div>
  );
  return <>
    {chip(<Sun size={15}/>, 'Rooftop solar', 'On the sun-facing slope', {left:12, top:12, animation:'none'})}
    {chip(<Layers size={15}/>, 'Insulated shell', 'Roof, walls and windows', {right:12, top:12, animation:'none'})}
    {chip(<Droplet size={15}/>, 'Rainwater tank', 'In the front garden', {right:12, bottom:12, animation:'none'})}
  </>;
}

export default function RetrofitHouse3D({fallback}:{fallback:ReactNode}){
  const [supported,setSupported] = useState<boolean|null>(null);

  useEffect(()=>{
    const canvas = document.createElement('canvas');
    try {
      const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
      setSupported(!!context);
      context?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch { setSupported(false); }
  },[]);

  /* While checking, and wherever WebGL is unavailable, the 2D drawing stands
     in — the measures are always explained, with or without a GPU. */
  if(supported !== true) return <>{fallback}</>;

  return (
    <div style={{position:'relative', height:'clamp(300px, 32vw, 380px)', borderRadius:'var(--r-card)',
      border:'var(--hair)', overflow:'hidden',
      background:'#fff'}}>
      <Canvas
        dpr={[1,1.5]}
        frameloop="demand"
        shadows="soft"
        camera={{position:[11.5,8.5,14], fov:36}}
        gl={{alpha:true, antialias:true, powerPreference:'low-power'}}
        role="img"
        aria-label="Three-dimensional modern two-storey white home with a broad rooftop solar array, large windows, planted garden and rainwater tank."
      >
        <ambientLight intensity={0.85}/>
        <hemisphereLight args={['#dce8f2','#8f9a86',0.85]}/>
        <directionalLight position={[5,8,4]} intensity={1.7} castShadow
          shadow-mapSize={[1024,1024]} shadow-bias={-0.0006}/>
        <House/>
        <ContactShadows position={[0.3,.36,0.4]} opacity={.38} scale={26}
          blur={2.6} far={7} resolution={512} color="#1d1a15"/>
        <OrbitControls
          enableZoom={false} enablePan={false}
          minPolarAngle={.5} maxPolarAngle={1.35}
          target={[0.3,1.9,0]}
        />
      </Canvas>
      <Chips/>
    </div>
  );
}
