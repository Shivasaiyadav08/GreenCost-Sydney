'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Layers3,Menu,X} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const LINKS = [
  {href:'/#how-it-works', label:'How it works', match:false},
  {href:'/compare', label:'Compare', match:'/compare'},
  {href:'/methodology', label:'Method & evidence', match:'/methodology'},
] as const;

export default function SiteHeader({compare=false}:{compare?:boolean}){
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(()=>{ setOpen(false); }, [path]);

  useEffect(()=>{
    if(!open) return;
    const onKey = (e:KeyboardEvent)=>{ if(e.key==='Escape'){ setOpen(false); trigger.current?.focus(); } };
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="gc-header">
      <div className="gc-shell gc-header-row">
        <Link href="/" className="gc-brand" aria-label="GreenCost home">
          <span className="gc-brand-mark" aria-hidden="true"><Layers3 size={17}/></span>
          <span className="gc-brand-word">greencost</span>
        </Link>

        <nav id="site-navigation" className={open?'gc-nav is-open':'gc-nav'} aria-label="Main">
          {LINKS.map(l=>(
            <Link key={l.href} href={l.href}
              aria-current={l.match && path===l.match ? 'page' : undefined}
              onClick={()=>setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="gc-header-actions">
          <ThemeToggle/>
          <Link href="/compare" className="gc-btn gc-btn-primary gc-btn-sm">
            {compare ? 'Your comparison' : 'Start comparison'}
            <ArrowUpRight size={14}/>
          </Link>
          <button ref={trigger} type="button" className="gc-burger"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open} aria-controls="site-navigation"
            onClick={()=>setOpen(o=>!o)}>
            {open ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>
      </div>
    </header>
  );
}