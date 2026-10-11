'use client';
import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {Canvas,useFrame} from '@react-three/fiber';
import {ContactShadows,OrbitControls} from '@react-three/drei';
import {useReducedMotion} from 'framer-motion';
import * as THREE from 'three';
import {Droplet,Layers,Sun} from 'lucide-react';
import {scenePalette} from '@/lib/scene-palette';

/**
 * Large two-storey cutaway home for the empty comparison state: a wide
 * 6.4 m footprint so every room has real space — hall/living, kitchen and
 * dining below; double bedroom, kids room and bathroom above, joined by a
 * staircase. Dark pitched roof with a 12-panel solar field, full-height
 * glazing, timber screens, car on its pad, dog by its kennel.
 *
 * The palette is deliberately theme-independent — the model depicts daylight
 * whether the page around it is light or dark, matching the landing hero.
 * No image assets; all geometry is procedural.
 *
 * Renders `fallback` (the 2D section drawing) while WebGL capability is being
 * checked and wherever it is unavailable, so the drawing is never lost.
 */

const TIMBER = '#7d5f3e';
const DARK_FRAME = '#39413c';
const PAVER = '#e6e1d4';
const SOIL = '#8a735c';
const ROOF_DARK = '#43484c';

/* Low hip roof: eaves at y 4.55, ridge along x at y 5.5. Dimensions are baked
   into the geometry below. */

/* Warm interior tones keep the cutaway feeling lived-in rather than hollow.
   Kept local so the shared hero palette is untouched. */
const LINING = '#ece4d2';
const RUG = '#d9cfbc';
const FABRIC = '#5f7561';
const BEDDING = '#f7f3ea';

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

function House({reduced}:{reduced:boolean}){
  const p = useMemo(()=>scenePalette(),[]);
  const group = useRef<THREE.Group>(null);

  /* Gable triangles closing the roof ends, in the side-wall planes. */
  const gableEnd = useMemo(()=>{
    const shape = new THREE.Shape();
    shape.moveTo(-2.6, 4.55);
    shape.lineTo(2.6, 4.55);
    shape.lineTo(0, 5.5);
    shape.closePath();
    return shape;
  },[]);

  /* Barely-there sway so the render doesn't feel frozen. Off under reduced
     motion. */
  useFrame(({clock})=>{
    if(reduced || !group.current) return;
    group.current.rotation.y = Math.sin(clock.elapsedTime * .12) * .04;
  });

  return (
    <group ref={group}>
      {/* white tray base + lawn inset */}
      <Box position={[0,.05,0]} size={[13,.5,10]} color={p.wallSecondary} roughness={.9}/>
      <Box position={[0,.3,0]} size={[12.4,.1,9.4]} color={p.lawn} roughness={.95}/>

      {/* floor slabs: ground and mid */}
      <Box position={[0,.42,0]} size={[6.4,.14,4.6]} color={p.wallSecondary}/>
      <Box position={[0,2.75,0]} size={[6.4,.12,4.6]} color={p.wallSecondary}/>

      {/* walls in white render across both floors; fronts stay open */}
      <Box position={[0,1.59,-2.24]} size={[6.4,2.2,.12]} color={p.wallSecondary} roughness={.9}/>
      <Box position={[-3.14,1.59,0]} size={[.12,2.2,4.6]} color={p.wallSecondary} roughness={.9}/>
      <Box position={[3.14,1.59,0]} size={[.12,2.2,4.6]} color={p.wallSecondary} roughness={.9}/>
      <Box position={[0,3.71,-2.24]} size={[6.4,1.8,.12]} color={p.wallSecondary} roughness={.9}/>
      <Box position={[-3.14,3.71,0]} size={[.12,1.8,4.6]} color={p.wallSecondary} roughness={.9}/>
      <Box position={[3.14,3.71,0]} size={[.12,1.8,4.6]} color={p.wallSecondary} roughness={.9}/>

      {/* warm lining on the inside faces, both floors */}
      <Box position={[0,1.59,-2.14]} size={[6.16,2.1,.06]} color={LINING} roughness={.95}/>
      <Box position={[-3.04,1.59,0]} size={[.06,2.1,4.36]} color={LINING} roughness={.95}/>
      <Box position={[3.04,1.59,0]} size={[.06,2.1,4.36]} color={LINING} roughness={.95}/>
      <Box position={[0,3.71,-2.14]} size={[6.16,1.7,.06]} color={LINING} roughness={.95}/>
      <Box position={[-3.04,3.71,0]} size={[.06,1.7,4.36]} color={LINING} roughness={.95}/>
      <Box position={[3.04,3.71,0]} size={[.06,1.7,4.36]} color={LINING} roughness={.95}/>

      {/* ground glass front in a timber portal frame */}
      <mesh position={[0,1.6,2.27]}>
        <boxGeometry args={[6.0,1.9,.05]}/>
        <meshStandardMaterial color="#8fb3a4" roughness={.08} metalness={.1}
          transparent opacity={.62} depthWrite={false}/>
      </mesh>
      <Box position={[0,2.66,2.27]} size={[6.4,.3,.14]} color={TIMBER} roughness={.7}/>
      <Box position={[0,.55,2.27]} size={[6.0,.12,.12]} color={TIMBER} roughness={.7}/>
      <Box position={[-3.14,1.6,2.27]} size={[.16,2.0,.16]} color={TIMBER} roughness={.7}/>
      <Box position={[3.14,1.6,2.27]} size={[.16,2.0,.16]} color={TIMBER} roughness={.7}/>
      {[-1.55,0,1.55].map(x=>(
        <Box key={x} position={[x,1.6,2.27]} size={[.09,1.9,.09]} color={DARK_FRAME} roughness={.6}/>
      ))}

      {/* upper front is glazed like the ground floor, so both levels read as
          one glass wall in the timber portal frame */}
      <Box position={[0,4.51,2.27]} size={[6.4,.2,.14]} color={TIMBER} roughness={.7}/>
      <Box position={[0,2.86,2.27]} size={[6.0,.1,.1]} color={TIMBER} roughness={.7}/>
      <Box position={[-3.14,3.7,2.27]} size={[.16,1.8,.16]} color={TIMBER} roughness={.7}/>
      <Box position={[3.14,3.7,2.27]} size={[.16,1.8,.16]} color={TIMBER} roughness={.7}/>

      {/* front door: timber surround, glass leaf, long pull handle */}
      <Box position={[1.75,1.55,2.32]} size={[0.1,2.0,0.12]} color={TIMBER} roughness={.7}/>
      <Box position={[2.65,1.55,2.32]} size={[0.1,2.0,0.12]} color={TIMBER} roughness={.7}/>
      <mesh position={[2.2,1.55,2.32]}>
        <boxGeometry args={[0.8,1.9,0.04]}/>
        <meshStandardMaterial color="#9dbdac" roughness={.08} metalness={.1}
          transparent opacity={.55} depthWrite={false}/>
      </mesh>
      <mesh position={[2.45,1.5,2.42]} castShadow>
        <cylinderGeometry args={[.025,.025,.9,8]}/>
        <meshStandardMaterial color={DARK_FRAME} roughness={.5} metalness={.4}/>
      </mesh>
      <Box position={[2.45,1.95,2.36]} size={[0.04,0.04,0.1]} color={DARK_FRAME} roughness={.5}/>
      <Box position={[2.45,1.05,2.36]} size={[0.04,0.04,0.1]} color={DARK_FRAME} roughness={.5}/>

      {/* upper glass front to match the ground floor */}
      <mesh position={[0,3.66,2.27]}>
        <boxGeometry args={[6.0,1.5,.05]}/>
        <meshStandardMaterial color="#8fb3a4" roughness={.08} metalness={.1}
          transparent opacity={.62} depthWrite={false}/>
      </mesh>
      {[-1.55,0,1.55].map(x=>(
        <Box key={`um2${x}`} position={[x,3.66,2.27]} size={[.09,1.5,.09]} color={DARK_FRAME} roughness={.6}/>
      ))}

      {/* timber screen veiling the left glass corner, both floors */}
      {[-2.9,-2.76,-2.62,-2.48,-2.34].map(x=>(
        <Box key={x} position={[x,2.5,2.65]} size={[.06,3.8,.06]} color={TIMBER} roughness={.7}/>
      ))}

      {/* porch column carrying the mid-floor front edge */}
      <Box position={[2.7,1.56,2.1]} size={[.22,2.26,.22]} color={p.wallSecondary} roughness={.85}/>

      {/* strip windows on the visible side wall, one per floor */}
      {[1.05,3.85].map(y=>(
      <group key={y} position={[3.2,y,-0.3]}>
        <mesh castShadow>
          <boxGeometry args={[.1,y > 2 ? 1.1 : 1.3,1.8]}/>
          <meshStandardMaterial color={DARK_FRAME} roughness={.6}/>
        </mesh>
        <mesh position={[.04,0,0]}>
          <boxGeometry args={[.06,y > 2 ? .95 : 1.15,1.66]}/>
          <meshStandardMaterial color="#8fb3a4" roughness={.08} metalness={.1} envMapIntensity={1.2}/>
        </mesh>
      </group>
      ))}
      <Box position={[3.22,.34,-0.3]} size={[.12,.07,1.95]} color={p.wallSecondary} roughness={.8}/>
      <Box position={[3.22,3.24,-0.3]} size={[.12,.07,1.95]} color={p.wallSecondary} roughness={.8}/>

      {/* pitched roof in dark grey: two slabs, gable ends, ridge cap */}
      <group position={[0,5.025,1.375]} rotation={[0.3325,0,0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[7.6,.1,3.1]}/>
          <meshStandardMaterial color={ROOF_DARK} roughness={.85}/>
        </mesh>
      </group>
      <group position={[0,5.025,-1.375]} rotation={[-0.3325,0,0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[7.6,.1,3.1]}/>
          <meshStandardMaterial color={ROOF_DARK} roughness={.85}/>
        </mesh>
      </group>
      <mesh position={[3.14,0,0]} rotation={[0,Math.PI/2,0]}>
        <shapeGeometry args={[gableEnd]}/>
        <meshStandardMaterial color={p.wallSecondary} roughness={.9} side={THREE.DoubleSide}/>
      </mesh>
      <mesh position={[-3.14,0,0]} rotation={[0,Math.PI/2,0]}>
        <shapeGeometry args={[gableEnd]}/>
        <meshStandardMaterial color={p.wallSecondary} roughness={.9} side={THREE.DoubleSide}/>
      </mesh>
      <Box position={[0,5.53,0]} size={[3.6,.09,.3]} color={ROOF_DARK} roughness={.8}/>

      {/* white fascia + gutter around the eaves, downpipe to a drain */}
      <Box position={[0,4.48,2.79]} size={[7.7,.16,.07]} color={p.wallSecondary} roughness={.8}/>
      <Box position={[0,4.48,-2.79]} size={[7.7,.16,.07]} color={p.wallSecondary} roughness={.8}/>
      <Box position={[0,4.4,2.9]} size={[7.7,.09,.14]} color={p.tank} roughness={.7}/>
      <Box position={[2.5,2.435,2.9]} size={[.1,3.93,.1]} color={p.tank} roughness={.7}/>

      {/* vent through the back slope */}
      <Box position={[-1.6,5.3,-1.0]} size={[.4,1.2,.4]} color={p.wallSecondary} roughness={.85}/>
      <Box position={[-1.6,5.93,-1.0]} size={[.56,.08,.56]} color={p.wallSecondary} roughness={.85}/>

      {/* solar field: 4 by 3 on the sun-facing slope */}
      <group position={[0,5.25,1.15]} rotation={[0.3325,0,0]}>
        {[-0.85,0,0.85].map(z=>(
          <mesh key={z} position={[0,-0.1,z]} castShadow>
            <boxGeometry args={[4.3,.05,.09]}/>
            <meshStandardMaterial color={p.frame} roughness={.7}/>
          </mesh>
        ))}
        {[-1.575,-0.525,0.525,1.575].map(x=>(
          <group key={x} position={[x,0.02,0]}>
            {[-0.85,0,0.85].map(z=>(
              <group key={z} position={[0,0,z]}>
                <mesh castShadow>
                  <boxGeometry args={[.95,.06,.8]}/>
                  <meshStandardMaterial color={p.panelFace} roughness={.2} metalness={.3}/>
                </mesh>
                <mesh position={[0,.035,0]}>
                  <boxGeometry args={[.02,.02,.75]}/>
                  <meshStandardMaterial color={p.panelGrid} roughness={.4}/>
                </mesh>
                <mesh position={[0,.035,0]} rotation={[0,Math.PI/2,0]}>
                  <boxGeometry args={[.02,.02,.75]}/>
                  <meshStandardMaterial color={p.panelGrid} roughness={.4}/>
                </mesh>
              </group>
            ))}
          </group>
        ))}
      </group>

      {/* staircase up the left wall to the upper floor */}
      {Array.from({length:12},(_,i)=>(
        <Box key={i} position={[-2.6,0.49+(i+1)*0.1935,1.7-i*0.33]}
          size={[0.9,0.07,0.37]} color={p.frame} roughness={.7}/>
      ))}

      {/* hall living set */}
      <Box position={[-0.7,0.5,0.35]} size={[2.4,0.03,1.6]} color={RUG} roughness={.95}/>
      <Box position={[-0.9,0.65,-1.2]} size={[1.8,0.32,0.8]} color={FABRIC} roughness={.9}/>
      <Box position={[-0.9,0.93,-1.55]} size={[1.8,0.55,0.18]} color={FABRIC} roughness={.9}/>
      <Box position={[-1.89,0.78,-1.2]} size={[0.18,0.5,0.8]} color={FABRIC} roughness={.9}/>
      <Box position={[0.09,0.78,-1.2]} size={[0.18,0.5,0.8]} color={FABRIC} roughness={.9}/>
      <Box position={[-0.5,0.79,0.5]} size={[1.0,0.07,0.6]} color={p.frame} roughness={.6}/>
      <Box position={[-0.5,0.64,0.5]} size={[0.5,0.24,0.35]} color={p.frame} roughness={.7}/>

      {/* kitchen along the back wall + fridge + dining set */}
      <Box position={[1.5,0.865,-1.85]} size={[1.8,0.75,0.5]} color={p.frame} roughness={.7}/>
      <Box position={[1.5,1.27,-1.85]} size={[1.86,0.06,0.55]} color={p.wallSecondary} roughness={.8}/>
      <Box position={[2.68,1.24,-1.85]} size={[0.5,1.5,0.5]} color={p.wallSecondary} roughness={.8}/>
      <Box position={[1.5,1.0,0.9]} size={[1.4,0.06,0.8]} color={TIMBER} roughness={.65}/>
      <Box position={[1.5,0.72,0.9]} size={[0.4,0.45,0.4]} color={TIMBER} roughness={.7}/>
      <Box position={[0.75,0.87,0.9]} size={[0.34,0.08,0.34]} color={FABRIC} roughness={.9}/>
      <Box position={[0.75,0.66,0.9]} size={[0.3,0.34,0.3]} color={p.frame} roughness={.7}/>
      <Box position={[2.25,0.87,0.9]} size={[0.34,0.08,0.34]} color={FABRIC} roughness={.9}/>
      <Box position={[2.25,0.66,0.9]} size={[0.3,0.34,0.3]} color={p.frame} roughness={.7}/>

      {/* floor lamp + pendants */}
      <mesh position={[2.7,1.14,-0.5]} castShadow>
        <cylinderGeometry args={[.03,.03,1.3,8]}/>
        <meshStandardMaterial color={p.frame} roughness={.7}/>
      </mesh>
      <mesh position={[2.7,1.85,-0.5]} castShadow>
        <cylinderGeometry args={[.16,.2,.24,16]}/>
        <meshStandardMaterial color={p.wallSecondary} roughness={.8}/>
      </mesh>
      {[-0.8,1.4].map(x=>(
        <group key={x} position={[x,0,0.35]}>
          <mesh position={[0,2.4,0]}>
            <cylinderGeometry args={[.015,.015,.6,6]}/>
            <meshStandardMaterial color={DARK_FRAME} roughness={.6}/>
          </mesh>
          <mesh position={[0,2.02,0]}>
            <cylinderGeometry args={[.13,.17,.2,14]}/>
            <meshStandardMaterial color={DARK_FRAME} roughness={.6}/>
          </mesh>
          <mesh position={[0,1.94,0]}>
            <sphereGeometry args={[.05,10,8]}/>
            <meshBasicMaterial color="#ffd9a0"/>
          </mesh>
        </group>
      ))}

      {/* upstairs double bedroom (left of the partition) */}
      <Box position={[-1.8,2.82,0.6]} size={[1.8,0.02,1.2]} color={RUG} roughness={.95}/>
      <Box position={[-1.75,2.95,-0.4]} size={[1.7,0.28,2.0]} color={p.wallSecondary} roughness={.85}/>
      <Box position={[-1.75,3.16,0.1]} size={[1.3,0.14,1.0]} color={FABRIC} roughness={.9}/>
      <Box position={[-1.75,3.2,-1.46]} size={[1.7,0.8,0.12]} color={p.frame} roughness={.7}/>
      <Box position={[-2.15,3.16,-1.1]} size={[0.5,0.12,0.35]} color={BEDDING} roughness={.9}/>
      <Box position={[-1.35,3.16,-1.1]} size={[0.5,0.12,0.35]} color={BEDDING} roughness={.9}/>
      <Box position={[-2.55,3.51,1.3]} size={[0.9,1.4,0.55]} color={p.frame} roughness={.7}/>

      {/* partition walls: double room | kids room | bathroom */}
      <Box position={[-0.5,3.66,0]} size={[0.08,1.7,4.2]} color={p.wallSecondary} roughness={.9}/>
      <Box position={[1.3,3.66,0.05]} size={[3.6,1.7,0.08]} color={p.wallSecondary} roughness={.9}/>

      {/* kids bedroom: two singles, toy blocks, rug */}
      <Box position={[-0.05,2.935,0.85]} size={[0.85,0.25,1.4]} color={p.wallSecondary} roughness={.85}/>
      <Box position={[-0.05,3.1,1.0]} size={[0.65,0.1,0.75]} color="#b0714f" roughness={.9}/>
      <Box position={[1.05,2.935,0.85]} size={[0.85,0.25,1.4]} color={p.wallSecondary} roughness={.85}/>
      <Box position={[1.05,3.1,1.0]} size={[0.65,0.1,0.75]} color={FABRIC} roughness={.9}/>
      <Box position={[0.5,2.82,1.75]} size={[2.4,0.02,0.5]} color={RUG} roughness={.95}/>
      <Box position={[-0.3,2.87,1.7]} size={[0.12,0.12,0.12]} color="#c96f4a" roughness={.8}/>
      <Box position={[-0.14,2.87,1.75]} size={[0.12,0.12,0.12]} color="#7fa3a6" roughness={.8}/>
      <Box position={[-0.22,2.99,1.72]} size={[0.12,0.12,0.12]} color="#d9b44a" roughness={.8}/>

      {/* ensuite bathroom */}
      <Box position={[2.2,3.03,-1.2]} size={[1.0,0.44,1.5]} color={p.wallSecondary} roughness={.85}/>
      <Box position={[2.2,3.2,-1.2]} size={[0.8,0.04,1.3]} color="#9dbdac" roughness={.3}/>
      <Box position={[0.1,3.21,-1.8]} size={[0.55,0.8,0.45]} color={p.frame} roughness={.7}/>
      <Box position={[0.1,3.01,-1.05]} size={[0.42,0.4,0.55]} color={BEDDING} roughness={.9}/>

      {/* timber deck, pavers and planting */}
      <Box position={[-0.3,.39,2.85]} size={[5.0,.08,1.1]} color={TIMBER} roughness={.75}/>
      {[-1.5,-0.5,0.5,1.5].map(x=>(
        <Box key={`p1${x}`} position={[x,.38,3.6]} size={[.9,.06,.8]} color={PAVER} roughness={.9}/>
      ))}
      {[-1.5,-0.5,0.5,1.5].map(x=>(
        <Box key={`p2${x}`} position={[x,.38,4.3]} size={[.9,.06,.8]} color={PAVER} roughness={.9}/>
      ))}
      <Box position={[-2.9,.4,3.2]} size={[1.6,.1,.6]} color={SOIL} roughness={.95}/>
      {[[-3.4,.55,3.2,.16],[-3.0,.58,3.15,.2],[-2.6,.55,3.25,.14],[-2.3,.52,3.1,.11]].map(([x,y,z,r],i)=>(
        <mesh key={i} position={[x,y,z]} scale={[1,.75,1]} castShadow>
          <icosahedronGeometry args={[r,1]}/>
          <meshStandardMaterial color={p.foliageLight} flatShading roughness={.9}/>
        </mesh>
      ))}
      {[[-3.8,.48,-2.0,.3],[6.05,.48,-0.6,.26]].map(([x,y,z,r],i)=>(
        <mesh key={i} position={[x,y,z]} castShadow>
          <icosahedronGeometry args={[r,1]}/>
          <meshStandardMaterial color={p.foliageLight} flatShading roughness={.9}/>
        </mesh>
      ))}

      {/* hero tree, taller than the house, and a young palm to the right */}
      <HeroTree position={[-5.2,0.35,0.8]} scale={1.7}/>
      <group position={[5.6,0.35,-3.2]}>
        <mesh position={[0,.6,0]} castShadow>
          <cylinderGeometry args={[.05,.07,1.2,6]}/>
          <meshStandardMaterial color={p.trunk} roughness={.95}/>
        </mesh>
        {[0,1,2,3,4].map(i=>(
          <mesh key={i} position={[Math.cos(i*1.26)*.35,1.3,Math.sin(i*1.26)*.35]}
            rotation={[0,-i*1.26,.5]} scale={[1,.35,.3]} castShadow>
            <icosahedronGeometry args={[.4,1]}/>
            <meshStandardMaterial color={p.foliageDark} flatShading roughness={.9}/>
          </mesh>
        ))}
      </group>

      {/* rainwater tank standing in the front garden, clear of the car */}
      <mesh position={[-5.0,1.0,3.4]} castShadow receiveShadow>
        <cylinderGeometry args={[.4,.4,1.3,24]}/>
        <meshStandardMaterial color={p.tank} roughness={.75}/>
      </mesh>
      <mesh position={[-5.0,1.69,3.4]} castShadow>
        <cylinderGeometry args={[.43,.43,.08,24]}/>
        <meshStandardMaterial color={p.tank} roughness={.7}/>
      </mesh>
      <mesh position={[-4.54,.95,3.4]}>
        <boxGeometry args={[.2,.12,.12]}/>
        <meshStandardMaterial color={p.tank} roughness={.7}/>
      </mesh>

      {/* dog house in the front garden, pup sitting out front with a bowl */}
      <group position={[-3.4,0.35,4.2]}>
        <Box position={[0,0.04,0]} size={[0.9,0.08,0.7]} color={p.frame} roughness={.7}/>
        <Box position={[0,0.33,-0.32]} size={[0.9,0.5,0.06]} color={p.frame} roughness={.7}/>
        <Box position={[-0.42,0.33,0]} size={[0.06,0.5,0.7]} color={p.frame} roughness={.7}/>
        <Box position={[0.42,0.33,0]} size={[0.06,0.5,0.7]} color={p.frame} roughness={.7}/>
        <Box position={[-0.315,0.33,0.32]} size={[0.27,0.5,0.06]} color={p.frame} roughness={.7}/>
        <Box position={[0.315,0.33,0.32]} size={[0.27,0.5,0.06]} color={p.frame} roughness={.7}/>
        <Box position={[0,0.27,0.31]} size={[0.3,0.38,0.02]} color={DARK_FRAME} roughness={.8}/>
        <group position={[0,0.62,0]} rotation={[0.15,0,0]}>
          <mesh castShadow>
            <boxGeometry args={[1.0,0.06,0.85]}/>
            <meshStandardMaterial color={p.roof} roughness={.8}/>
          </mesh>
        </group>
        <Box position={[0,0.2,0.48]} size={[0.16,0.24,0.2]} color="#a9805e" roughness={.9}/>
        <mesh position={[0,0.38,0.52]} castShadow>
          <sphereGeometry args={[.1,12,10]}/>
          <meshStandardMaterial color="#a9805e" roughness={.9}/>
        </mesh>
        <Box position={[-0.05,0.48,0.5]} size={[0.04,0.09,0.02]} color="#7d5a40" roughness={.9}/>
        <Box position={[0.05,0.48,0.5]} size={[0.04,0.09,0.02]} color="#7d5a40" roughness={.9}/>
        <Box position={[0,0.35,0.6]} size={[0.06,0.05,0.05]} color="#7d5a40" roughness={.9}/>
        <mesh position={[0.38,0.035,0.5]} castShadow>
          <cylinderGeometry args={[.09,.07,.07,12]}/>
          <meshStandardMaterial color={DARK_FRAME} roughness={.7}/>
        </mesh>
        <mesh position={[0.38,0.07,0.5]}>
          <cylinderGeometry args={[.07,.07,.02,12]}/>
          <meshStandardMaterial color="#9dbdac" roughness={.4}/>
        </mesh>
      </group>

      {/* side garage: big sectional door with a window row so it reads as a
          garage, not a white box. Timber trim ties it to the house portal */}
      <Box position={[4.65,.42,1.8]} size={[2.6,.14,3.0]} color={p.wallSecondary}/>
      <Box position={[4.65,1.545,1.8]} size={[2.6,2.11,3.0]} color={p.wallSecondary} roughness={.9}/>
      <Box position={[4.65,2.67,1.8]} size={[2.9,.14,3.3]} color={p.wallSecondary} roughness={.85}/>
      <Box position={[4.65,1.44,3.32]} size={[2.0,1.9,.06]} color="#e8e6dc" roughness={.85}/>
      {[0.85,1.2,1.55,1.9].map(y=>(
        <Box key={y} position={[4.65,y,3.36]} size={[2.0,.025,.02]} color="#c4c7bd" roughness={.8}/>
      ))}
      {[3.95,4.65,5.35].map(x=>(
        <Box key={x} position={[x,2.12,3.36]} size={[.3,.3,.02]} color={DARK_FRAME} roughness={.6}/>
      ))}
      <Box position={[3.59,1.49,3.34]} size={[.12,2.0,.08]} color={TIMBER} roughness={.7}/>
      <Box position={[5.71,1.49,3.34]} size={[.12,2.0,.08]} color={TIMBER} roughness={.7}/>
      <Box position={[4.65,2.45,3.34]} size={[2.36,.12,.08]} color={TIMBER} roughness={.7}/>
      <Box position={[4.65,2.56,3.5]} size={[2.9,.09,.14]} color={p.tank} roughness={.7}/>
      <Box position={[5.95,1.6,3.5]} size={[.09,2.0,.09]} color={p.tank} roughness={.7}/>
      <Box position={[5.95,.39,3.5]} size={[.24,.08,.24]} color={p.road} roughness={.9}/>

      {/* the car on a clay driveway apron running from the garage door */}
      <Box position={[4.3,.39,4.0]} size={[3.8,.08,2.0]} color="#b08657" roughness={.9}/>
      {[3.65,4.35].map(z=>(
        <Box key={z} position={[4.3,.43,z]} size={[3.8,.02,.035]} color="#96703f" roughness={.9}/>
      ))}
      <group position={[4.7,0.08,3.9]}>
        {[[-0.55,-0.75],[0.55,-0.75],[-0.55,0.75],[0.55,0.75]].map(([x,z])=>(
          <group key={`${x}${z}`} position={[x,.65,z]}>
            <mesh rotation={[Math.PI/2,0,0]} castShadow>
              <cylinderGeometry args={[.22,.22,.16,16]}/>
              <meshStandardMaterial color="#2e3330" roughness={.9}/>
            </mesh>
            <mesh rotation={[Math.PI/2,0,0]}>
              <cylinderGeometry args={[.1,.1,.17,12]}/>
              <meshStandardMaterial color="#c9cdc9" roughness={.4} metalness={.5}/>
            </mesh>
          </group>
        ))}
        <Box position={[0,.83,0]} size={[2.4,.42,1.15]} color="#6e8f8a" roughness={.35}/>
        <Box position={[-0.05,1.2,0]} size={[1.3,.32,1.0]} color={p.glass} glass/>
        <Box position={[-0.15,1.4,0]} size={[1.0,.07,1.02]} color="#6e8f8a" roughness={.35}/>
        <Box position={[-1.21,.85,-0.35]} size={[.04,.1,.18]} color="#fff6d8" roughness={.4}/>
        <Box position={[-1.21,.85,0.35]} size={[.04,.1,.18]} color="#fff6d8" roughness={.4}/>
        <Box position={[1.21,.85,-0.35]} size={[.04,.1,.18]} color="#b04038" roughness={.4}/>
        <Box position={[1.21,.85,0.35]} size={[.04,.1,.18]} color="#b04038" roughness={.4}/>
        <Box position={[0.5,1.0,-0.62]} size={[.12,.08,.08]} color="#6e8f8a" roughness={.4}/>
        <Box position={[0.5,1.0,0.62]} size={[.12,.08,.08]} color="#6e8f8a" roughness={.4}/>
      </group>

      {/* drifting clouds and a static sun */}
      {[[-5.5,7,-3,1],[4.5,7.5,-4,.7]].map(([x,y,z,s],i)=>(
        <group key={i} position={[x,y,z]} scale={s}>
          {[[-.3,0,.2],[0,.1,.3],[.3,0,.22]].map(([cx,cy,r],j)=>(
            <mesh key={j} position={[cx,cy,0]} scale={[1,.7,.5]}>
              <sphereGeometry args={[r,16,10]}/>
              <meshBasicMaterial color="#ffffff"/>
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[-5.5,6.5,-3.5]}>
        <sphereGeometry args={[.35,24,16]}/>
        <meshBasicMaterial color="#ffce66"/>
      </mesh>

      {/* warm interior lights, one per floor */}
      <pointLight position={[0,2.2,0.4]} intensity={16} distance={10} color="#ffd9a0"/>
      <pointLight position={[0,1.2,1.0]} intensity={6} distance={5} color="#ffe4b8"/>
      <pointLight position={[0,3.9,0.4]} intensity={9} distance={8} color="#ffd9a0"/>
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
  /* Called here, before the early return below — hooks must run in the same
     order on every render, and the capability check returns early. */
  const reduced = !!useReducedMotion();

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
      background:'linear-gradient(180deg, #dfe9ef 0%, #f5f4f3 100%)'}}>
      <Canvas
        dpr={[1,1.75]}
        shadows="soft"
        camera={{position:[11.5,8.5,14], fov:36}}
        gl={{alpha:true, antialias:true, powerPreference:'low-power'}}
        role="img"
        aria-label="Three dimensional cutaway of a large two storey family home with hall, kitchen and dining below, double bedroom, kids room and bathroom above, a large rooftop solar array, a car on its pad, a side garage, a dog by its kennel and a rainwater tank in the front garden."
      >
        <ambientLight intensity={0.85}/>
        <hemisphereLight args={['#dce8f2','#8f9a86',0.85]}/>
        <directionalLight position={[5,8,4]} intensity={1.7} castShadow
          shadow-mapSize={[1024,1024]} shadow-bias={-0.0006}/>
        <House reduced={reduced}/>
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
