import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Minus, X } from 'lucide-react'
import { face, hush, nudge, poke, stopCompanion, syncSurroundings, useCompanion } from './brain.js'
import { useDebrisMotion } from './debris.js'
import './companion.css'

const KEY = 'ileak:companion-min'
const IDLE_MS = 45000
const ACTIONS = 'button, a, [role="button"], select, summary, label, input[type="checkbox"], input[type="radio"]'

// Where the user is, for her context.
const page = () =>
  document.querySelector('.calc') ? 'result cutscene' : document.querySelector('.gate') ? 'agreement / block screen' : 'main page'

// Most actions get a remark: clicks are heard here (capture phase, a beat late so a
// specific nudge from the clicked control wins), plus idling and coming back to the tab.
function useWatch() {
  useEffect(() => {
    let timer
    const click = (e) => {
      const el = e.target.closest?.(ACTIONS)
      if (!el || el.closest('.companion, .cp-space')) return
      const label = (el.getAttribute('aria-label') || el.title || el.innerText || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 60)
      clearTimeout(timer)
      timer = setTimeout(() => nudge('click', { label, page: page() }, 0), 350)
    }
    let idle
    const active = () => {
      clearTimeout(idle)
      idle = setTimeout(() => nudge('idle', { page: page() }, 1), IDLE_MS)
    }
    let hiddenAt = 0
    const visible = () => {
      syncSurroundings()
      if (document.hidden) hiddenAt = Date.now()
      else if (hiddenAt && Date.now() - hiddenAt > 8000) nudge('return', { away_seconds: Math.round((Date.now() - hiddenAt) / 1000) }, 1)
    }
    document.addEventListener('click', click, true)
    document.addEventListener('visibilitychange', visible)
    const surroundings = new MutationObserver(syncSurroundings)
    surroundings.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'data-level', 'data-gone', 'data-motion', 'data-flight', 'inert'] })
    for (const e of ['pointerdown', 'keydown', 'scroll']) window.addEventListener(e, active, { passive: true })
    active()
    return () => {
      clearTimeout(timer)
      clearTimeout(idle)
      document.removeEventListener('click', click, true)
      document.removeEventListener('visibilitychange', visible)
      surroundings.disconnect()
      for (const e of ['pointerdown', 'keydown', 'scroll']) window.removeEventListener(e, active)
    }
  }, [])
}

// A persistent MSN conversation bubble. Its body scrolls to each incoming phrase;
// clicking anywhere dismisses it, with the close button also reachable by keyboard.
function Toast({ bubble, typing }) {
  const { id, msgs, face: f } = bubble
  const body = useRef(null)
  useEffect(() => {
    if (body.current) body.current.scrollTop = body.current.scrollHeight
  }, [msgs.length, typing])
  const dismiss = () => hush(id)
  return (
    <div className="cp-toast" data-bubble-id={id} role="group" aria-label="ข้อความจากน้องปลั๊ก" onClick={dismiss}>
      <div className="cp-toast-bar">
        <img src={face(f)} alt="" />
        <span><b>น้องปลั๊ก</b> says:</span>
        <button type="button" onClick={(e) => { e.stopPropagation(); dismiss() }} aria-label="ปิดข้อความของน้องปลั๊ก"><X size={12} strokeWidth={3} /></button>
      </div>
      <div ref={body} className="cp-toast-body" role="log" aria-live="polite" aria-relevant="additions" aria-label="ข้อความ">
        {msgs.length > 0 && <ul>{msgs.map((m, i) => <li key={i}>{m}</li>)}</ul>}
        {typing && <small className="cp-typing" aria-hidden="true">น้องปลั๊กกำลังพิมพ์<i>.</i><i>.</i><i>.</i></small>}
      </div>
    </div>
  )
}

function Buddy({ min, minimise, face: f, busy, space = false }) {
  if (min) return (
    <button type="button" className="cp-orb" onClick={() => minimise(false)} aria-label="เปิดหน้าต่างน้องปลั๊ก">
      <img src={face(f)} alt="" />
    </button>
  )
  return (
    <div className="cp-window">
      <div className="cp-title">
        <span>น้องปลั๊ก</span>
        <button type="button" onClick={() => minimise(true)} aria-label="ย่อน้องปลั๊ก"><Minus size={11} strokeWidth={3} /></button>
      </div>
      <button type="button" className="cp-portrait" onClick={poke} aria-label="จิ้มน้องปลั๊ก">
        <img key={f} src={face(f)} alt="" />
      </button>
      <div className="cp-status">
        <i className={busy ? 'busy' : ''} />
        {busy ? 'กำลังหาคำพูดแรงๆ' : space ? 'ออนไลน์ · หลงอยู่ในอวกาศ' : 'ออนไลน์ · กำลังตัดสินเธอ'}
      </div>
    </div>
  )
}

function Drifter({ motion, id, kind, children }) {
  const ref = useRef(null)
  useLayoutEffect(() => motion.add(String(id), ref.current, kind), [motion, id, kind])
  return <div ref={ref} className={`cp-drifter cp-float-${kind}`} data-space-id={id}>{children}</div>
}

function SpaceCompanion({ debris, min, minimise, face: f, busy }) {
  const root = useRef(null)
  const motion = useDebrisMotion(root)
  return (
    <div ref={root} className="cp-space" aria-label="น้องปลั๊กและข้อความลอยรอบหลุมดำ">
      <Drifter motion={motion} id="buddy" kind="buddy">
        <Buddy min={min} minimise={minimise} face={f} busy={busy} space />
      </Drifter>
      {debris.map((bubble) => (
        <Drifter key={bubble.id} motion={motion} id={bubble.id} kind="toast">
          <Toast bubble={bubble} typing={false} />
        </Drifter>
      ))}
    </div>
  )
}

// น้องปลั๊ก: always in the bottom-right corner, over every page and overlay. A small
// XP Messenger-style window (title bar, glossy portrait frame, status line); minimised
// she's a round orb that still talks.
export default function Companion({ covered }) {
  const { bubbles, activeBubble, msgs, typing, face: f, stowaway, spaceBubble, debris } = useCompanion()
  // CalcOverlay turns this flag on after committing its DOM and off on cleanup.
  const surface = stowaway ? document.querySelector('.calc') : null
  const [min, setMin] = useState(() => {
    try { return localStorage.getItem(KEY) === '1' } catch { return false }
  })
  useWatch()
  useEffect(() => () => stopCompanion(), [])
  const minimise = (on) => {
    setMin(on)
    try { localStorage.setItem(KEY, on ? '1' : '0') } catch { /* storage blocked */ }
  }
  const busy = typing && !msgs.length
  const cls = `companion${covered ? ' covered' : ''}${min ? ' min' : ''}`
  const toast = !stowaway && bubbles.length > 0 && (
    <div className="cp-toasts">
      {bubbles.map((bubble) => <Toast key={bubble.id} bubble={bubble} typing={typing && activeBubble === bubble.id} />)}
    </div>
  )

  if (stowaway) {
    return (
      <>
        <aside className={`${cls} cp-launcher`} aria-label="ข้อความใหม่ของน้องปลั๊ก">
          {spaceBubble && <Toast bubble={spaceBubble} typing={typing} />}
        </aside>
        {surface && createPortal(<SpaceCompanion debris={debris} min={min} minimise={minimise} face={f} busy={busy} />, surface)}
      </>
    )
  }
  return (
    <aside className={cls} aria-label="น้องปลั๊ก">
      {toast}
      <Buddy min={min} minimise={minimise} face={f} busy={busy} />
    </aside>
  )
}
