'use client';
import {Component,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {ContactShadows,OrbitControls} from '@react-three/drei';
import {useReducedMotion} from 'framer-motion';
import {Minus,Plus,RotateCcw} from 'lucide-react';
import * as THREE from 'three';
import RoadTraffic from './RoadTraffic';
import DayNightSky from './DayNightSky';
import {scenePalette,type ScenePalette} from '@/lib/scene-palette';

function Fallback(){
  return (
    <div className="gc-stage-fallback">
      <b>A home, thoughtfully improved.</b>
      <small>Compare better insulation, solar and water-saving upgrades.</small>
    </div>
  );
}

/* A WebGL context can still fail to initialise on some drivers. Swapping to a
   static explanation beats showing an empty canvas. */
class Boundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError(){ return {failed: true}; }
  render(){ return this.state.failed ? <Fallback/> : this.props.children; }
}

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

function Tree({x, z, p}:{x:number; z:number; p:ScenePalette}){
  return (
    <group position={[x,0,z]}>
      <mesh position={[0,.7,0]} castShadow>
        <cylinderGeometry args={[.055,.08,1.4,8]}/>
        <meshStandardMaterial color={p.trunk} roughness={.95}/>
      </mesh>
      {([[0,1.7,0,.65],[.3,1.9,.1,.5],[-.25,2,.1,.5],[0,2.35,0,.43]] as const).map(([a,b,c,r],i)=>(
        <mesh key={i} position={[a,b,c]} castShadow>
          <icosahedronGeometry args={[r,1]}/>
          <meshStandardMaterial color={i%2?p.foliageDark:p.foliageLight} flatShading roughness={.9}/>
        </mesh>
      ))}
    </group>
  );
}

function Home({floors, solar, reduced, night, p}:{
  floors:number; solar:boolean; reduced:boolean; night:boolean; p:ScenePalette;
}){
  const scene = useRef<THREE.Group>(null);
  const height = Math.min(4, Math.max(1, Math.round(floors)));

  /* A very slow sway keeps the render from feeling frozen without reading as
     a spin. Disabled entirely when the visitor asks for reduced motion. */
  useFrame(({clock})=>{
    if(reduced || !scene.current) return;
    scene.current.rotation.y = Math.sin(clock.elapsedTime*.12) * .05;
  });

  return (
    <group ref={scene}>
      {/* Plot and lawn */}
      <Box position={[0,-.25,1.3]} size={[7.9,.4,9.9]} color={p.plot} roughness={.95}/>
      <Box position={[0,-.02,1.3]} size={[7.7,.12,9.7]} color={p.lawn} roughness={.95}/>

      <RoadTraffic reduced={reduced} night={night} palette={p}/>

      {/* Driveway */}
      <Box position={[.9,.06,2]} size={[4,.08,1.8]} color={p.driveway} roughness={.9}/>

      {/* Storeys */}
      {Array.from({length:height}, (_,i)=>(
        <group key={i} position={[0,i*1.35,0]}>
          <Box position={[-1,.67,-.5]} size={[2.5,1.3,3.3]} color={p.wallPrimary}/>
          <Box position={[1.4,.67,-.95]} size={[2.3,1.3,2.4]} color={p.wallSecondary}/>
          <Box position={[.1,1.34,-.5]} size={[5.1,.12,3.55]} color={p.roof}/>
          <Box position={[1.4,.7,.29]} size={[2.1,.95,.05]} color={p.glass} glass/>
          <Box position={[-1,.7,1.18]} size={[2.1,.9,.05]} color={p.glass} glass/>
          {Array.from({length:10},(_,n)=>(
            <Box key={n} position={[-2.02+n*.225,.7,1.32]} size={[.045,1.15,.17]} color={p.frame}/>
          ))}
          <Box position={[2.57,.75,-.8]} size={[.05,.9,1.6]} color={p.glass} glass/>
        </group>
      ))}

      {/* Roof plane, tinted by whether solar is specified */}
      <Box position={[.1,height*1.35+.07,-.5]} size={[4.8,.13,3.1]}
        color={solar ? p.roofSolar : p.wallSecondary} roughness={solar ? .6 : .85}/>

      {/* Solar array */}
      {solar && [-1.35,0,1.35].map(x=>(
        <group key={x} position={[x,height*1.35+.24,-.5]} rotation={[-.15,0,0]}>
          <Box position={[0,0,0]} size={[1.12,.08,1.9]} color={p.panelFace} glass roughness={.18}/>
          {[-.37,0,.37].map(v=>(
            <Box key={v} position={[v,.047,0]} size={[.013,.01,1.85]} color={p.panelGrid}/>
          ))}
          {[-.6,0,.6].map(v=>(
            <Box key={v} position={[0,.047,v]} size={[1.1,.01,.013]} color={p.panelGrid}/>
          ))}
        </group>
      ))}

      {/* Front path */}
      <Box position={[-.25,.06,2.8]} size={[1.5,.06,.3]} color={p.driveway} roughness={.9}/>
      <Box position={[-.25,.06,2.35]} size={[1.5,.06,.3]} color={p.driveway} roughness={.9}/>

      <Tree x={-3.05} z={-.6} p={p}/>
      <Tree x={3.1} z={1.8} p={p}/>
      <Tree x={-2.9} z={2.2} p={p}/>

      {/* Rainwater tank */}
      {solar && (
        <mesh position={[2.9,.7,-2]} castShadow>
          <cylinderGeometry args={[.42,.42,1.4,24]}/>
          <meshStandardMaterial color={p.tank} roughness={.75}/>
        </mesh>
      )}
    </group>
  );
}

function CameraRig({floors, reduced, zoom}:{floors:number; reduced:boolean; zoom:number}){
  const {camera, invalidate} = useThree();
  const height = Math.min(4, Math.max(1, Math.round(floors)));

  useEffect(()=>{
    const distance = height >= 3 ? 11.8 : 9.9;
    const targetY = height*1.35/2;
    const targetZ = 1.3;
    const baseY = 7.4 + (height-2)*1.5;
    camera.position.set(
      distance*.82*zoom,
      targetY + (baseY-targetY)*zoom,
      targetZ + (distance+2.2-targetZ)*zoom,
    );
    camera.lookAt(0, targetY, targetZ);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, height, invalidate, reduced, zoom]);

  return (
    <OrbitControls
      enableZoom
      enablePan={false}
      enableDamping={!reduced}
      minDistance={6}
      maxDistance={26}
      minPolarAngle={.45}
      maxPolarAngle={1.35}
      target={[0, height*1.35/2, 1.3]}
    />
  );
}

export default function WorldScene({floors = 2, solar = true}:{floors?:number; solar?:boolean; busy?:boolean}){
  /* The scene palette is deliberately theme-independent: the model is lit for
     daylight on a dark page exactly as it is on a light one, matching the
     original design. */
  const palette = useMemo(()=>scenePalette(), []);
  const reduced = !!useReducedMotion();
  const [supported, setSupported] = useState(false);
  const [visible, setVisible] = useState(true);
  const [night, setNight] = useState(false);
  const [paused, setPaused] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [zoom, setZoom] = useState(1);
  const host = useRef<HTMLDivElement>(null);

  const defaultZoom = mobile ? 1.24 : 1;

  useEffect(()=>{
    const query = window.matchMedia('(max-width: 700px)');
    const update = ()=>setMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return ()=>query.removeEventListener('change', update);
  },[]);

  /* Capability and idle checks. Rendering stops when the panel scrolls away or
     the tab is hidden, and when the visitor pauses or prefers reduced motion,
     so an idle hero costs nothing. */
  useEffect(()=>{
    const canvas = document.createElement('canvas');
    try {
      const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
      setSupported(!!context);
      context?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch { setSupported(false); }

    const observer = new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting), {rootMargin:'150px'});
    if(host.current) observer.observe(host.current);
    const onVisibility = ()=>setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return ()=>{
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  /* Stop the animated WebGL scene during touch and wheel scrolling. The
     controls resume as soon as scrolling settles, avoiding competition with
     the browser's main-thread scroll work on phones. */
  useEffect(()=>{
    let scrollEnd: ReturnType<typeof setTimeout> | undefined;
    const pauseWhileScrolling=()=>{
      setScrolling(true);
      if(scrollEnd) clearTimeout(scrollEnd);
      scrollEnd=setTimeout(()=>setScrolling(false),180);
    };
    window.addEventListener('scroll',pauseWhileScrolling,{passive:true});
    return ()=>{
      window.removeEventListener('scroll',pauseWhileScrolling);
      if(scrollEnd) clearTimeout(scrollEnd);
    };
  },[]);

  const storeys = Math.min(4, Math.max(1, Math.round(floors)));

  return (
    <div ref={host} className="gc-canvas">
      <Boundary>
        {supported ? (
          <Canvas
            dpr={[1,1.5]}
            shadows="soft"
            frameloop={reduced || paused || !visible || scrolling ? 'demand' : 'always'}
            camera={{position:[9.2,8.5,13.5], fov:36}}
            gl={{alpha:true, antialias:true, powerPreference:'low-power'}}
            role="img"
            aria-label={`Interactive preview of a ${storeys}-storey home with optional solar, a small street, a car and a cyclist; ${night?'night':'day'} lighting`}
          >
            <color attach="background" args={[palette.fog]}/>
            <fog attach="fog" args={[palette.fog, 26, 46]}/>

            <DayNightSky
              floors={floors}
              paused={reduced || paused}
              host={host}
              onNightChange={setNight}
              palette={palette}
            />

            <Home floors={floors} solar={solar} reduced={reduced || paused} night={night} p={palette}/>

            {/* Contact shadow grounds the model; without it the plot edge reads
                as a floating slab. */}
            <ContactShadows
              position={[0,-.06,1.3]}
              opacity={.32}
              scale={16}
              blur={2.6}
              far={7}
              resolution={512}
              color="#1d1a15"
            />

            <CameraRig floors={floors} reduced={reduced || paused} zoom={zoom * defaultZoom}/>
          </Canvas>
        ) : <Fallback/>}
      </Boundary>

      {supported && (
        <div className="gc-sky-status">
          <span>{night ? 'Night' : 'Day'}</span>
          {!reduced && (
            <button type="button" aria-label={paused ? 'Resume scene animation' : 'Pause scene animation'}
              aria-pressed={paused} onClick={()=>setPaused(v=>!v)}>
              {paused ? 'Play' : 'Pause'}
            </button>
          )}
          <small>Illustrative cycle</small>
        </div>
      )}

      {supported && (
        <div className="gc-zoom-controls" role="group" aria-label="Model zoom controls">
          <button type="button" aria-label="Zoom out" onClick={()=>setZoom(value=>Math.min(1.8,value+.12))}>
            <Minus size={17}/>
          </button>
          <button type="button" aria-label="Reset model zoom" onClick={()=>setZoom(1)}>
            <RotateCcw size={15}/>
          </button>
          <button type="button" aria-label="Zoom in" onClick={()=>setZoom(value=>Math.max(.76,value-.12))}>
            <Plus size={17}/>
          </button>
        </div>
      )}
    </div>
  );
}
