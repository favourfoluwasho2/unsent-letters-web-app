'use client'

import { useState } from 'react'
import { Archive, ArrowLeft, ChevronRight, Feather, Flag, Heart, Mail, Menu, PenLine, Send, ShieldCheck } from 'lucide-react'

type View = 'write' | 'read' | 'replies'

type Letter = { serial: string; date: string; body: string; replyCount: number }

type Reply = { serial: string; letterSerial: string; body: string; date: string }

const letters: Letter[] = [
  { serial: 'L-4821', date: 'October 7, 2026', body: 'I keep comparing the chapter I am living to everyone else’s highlight reel. Some days I feel behind, even though I know there is no single timeline for a life. I am trying to remember that quiet progress still counts.', replyCount: 12 },
  { serial: 'L-1742', date: 'Undated', body: 'I moved to a new city for a fresh start, but the quiet feels louder than I expected. I miss having people who know the small details. I hope I can be patient while I build something new here.', replyCount: 8 },
]

const myReplies: Reply[] = [
  { serial: 'R-1093', letterSerial: 'L-4821', body: 'You are not behind. The fact that you are still paying attention to your life is a kind of progress, even when it does not make a good highlight reel.', date: 'A few minutes ago' },
  { serial: 'R-7760', letterSerial: 'L-4821', body: 'Quiet progress absolutely counts. I hope you give yourself the same patience you would give someone you love.', date: 'Yesterday' },
]

export default function Page() {
  const [view, setView] = useState<View>('write')
  const [letter, setLetter] = useState(letters[0])
  const [body, setBody] = useState('')
  const [dated, setDated] = useState(false)
  const [reply, setReply] = useState('')
  const [notice, setNotice] = useState('')

  function postLetter() {
    if (body.trim().length < 20) { setNotice('Please write at least 20 characters so a stranger has something to hold onto.'); return }
    setNotice('Your letter is being read with care. It will appear once it passes our safety check.')
    setBody('')
  }

  function sendReply() {
    if (reply.trim().length < 20) { setNotice('Please write a little more so your encouragement can be helpful.'); return }
    setNotice('Your reply is being screened with care before it is shared.')
    setReply('')
  }

  return (
    <main className="min-h-screen bg-sky-paper text-navy-ink">
      <header className="border-b border-navy-ink/10 bg-sky-paper/90 px-5 py-4 backdrop-blur-sm md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button className="flex items-center gap-3 text-left" onClick={() => setView('write')} aria-label="Go to write a letter">
            <span className="grid size-10 place-items-center rounded-full bg-navy-ink text-sky-paper"><Feather className="size-5" /></span>
            <span><span className="block font-serif text-xl font-semibold tracking-tight">Unsent Letters</span><span className="hidden text-xs uppercase tracking-[0.2em] text-navy-ink/55 sm:block">Leave something kind here</span></span>
          </button>
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main navigation">
            {([['write', 'Write', PenLine], ['read', 'Read', Mail], ['replies', 'My replies', Archive] ] as const).map(([key, label, Icon]) => <button key={key} onClick={() => { setView(key); setNotice('') }} className={`nav-button ${view === key ? 'nav-button-active' : ''}`}><Icon className="size-4" />{label}</button>)}
          </nav>
          <button className="rounded-lg p-2 sm:hidden" aria-label="Open navigation"><Menu className="size-5" /></button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-12 px-5 py-10 md:px-10 md:py-16">
        <aside className="hidden w-40 shrink-0 flex-col gap-2 pt-2 sm:flex">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-navy-ink/45">Your mailbox</p>
          {([['write', 'Write', PenLine], ['read', 'Read', Mail], ['replies', 'My replies', Archive] ] as const).map(([key, label, Icon]) => <button key={key} onClick={() => { setView(key); setNotice('') }} className={`side-link ${view === key ? 'side-link-active' : ''}`}><Icon className="size-4" />{label}<ChevronRight className={`ml-auto size-3 transition-opacity ${view === key ? 'opacity-100' : 'opacity-0'}`} /></button>)}
          <div className="mt-auto hidden pt-24 text-xs leading-relaxed text-navy-ink/50 lg:block">No names.<br />No profiles.<br />Just a place to be heard.</div>
        </aside>

        <section className="min-w-0 max-w-2xl flex-1">
          {view === 'write' && <>
            <div className="mb-9"><p className="eyebrow">A quiet place to begin</p><h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight md:text-5xl">Write what you can&apos;t say out loud.</h1><p className="mt-4 max-w-lg text-base leading-7 text-navy-ink/65">Leave an honest note for a stranger. Someone who needs it may find it today.</p></div>
            <div className="paper-card p-6 md:p-9">
              <div className="mb-6 flex items-center justify-between text-sm text-navy-ink/55"><span className="font-serif italic">A letter to no one in particular</span><span className="serial">New letter</span></div>
              <label htmlFor="letter" className="sr-only">Your letter</label><textarea id="letter" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Dear stranger,\n\n" className="min-h-64 w-full resize-y border-0 bg-transparent font-serif text-lg leading-8 text-navy-ink outline-none placeholder:text-navy-ink/35 focus:ring-0" />
              <div className="mt-7 flex flex-col gap-5 border-t border-navy-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between"><label className="flex cursor-pointer items-center gap-3 text-sm text-navy-ink/65"><input type="checkbox" checked={dated} onChange={(e) => setDated(e.target.checked)} className="size-4 accent-red-stamp" />Add today&apos;s date</label><button onClick={postLetter} className="primary-button"><Send className="size-4" />Post letter</button></div>
            </div>
            {notice && <div role="status" className="mt-5 rounded-xl border border-navy-ink/10 bg-white/50 px-4 py-3 text-sm leading-6 text-navy-ink/70"><ShieldCheck className="mr-2 inline size-4 text-red-stamp" />{notice}</div>}
            <p className="mt-8 text-center text-xs leading-5 text-navy-ink/45">Your letter is anonymous. We only keep a secure device token so you can find your replies.</p>
          </>}

          {view === 'read' && <>
            <div className="mb-8 flex items-end justify-between gap-4"><div><p className="eyebrow">From someone out there</p><h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">A letter for you.</h1></div><button onClick={() => setLetter(letters[(letters.indexOf(letter) + 1) % letters.length])} className="secondary-button"><ArrowLeft className="size-4 rotate-180" />Another letter</button></div>
            <article className="paper-card p-6 md:p-10"><div className="mb-8 flex items-center justify-between border-b border-navy-ink/10 pb-5"><span className="serial">{letter.serial}</span><span className="font-serif text-sm italic text-navy-ink/55">{letter.date}</span></div><p className="whitespace-pre-wrap font-serif text-xl leading-9 text-navy-ink">{letter.body}</p><div className="mt-10 flex justify-end"><button className="report-button"><Flag className="size-3.5" />Report</button></div></article>
            <div className="mt-8 rounded-2xl border border-navy-ink/10 bg-white/35 p-6 md:p-8"><div className="mb-5 flex items-start gap-3"><Heart className="mt-1 size-5 text-red-stamp" /><div><h2 className="font-serif text-xl font-semibold">Write back</h2><p className="mt-1 text-sm text-navy-ink/55">A small kindness can travel a long way.</p></div></div><textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Encourage, don't give orders or ask for personal details." className="min-h-32 w-full resize-y rounded-xl border border-navy-ink/15 bg-white/45 p-4 font-serif leading-7 outline-none placeholder:text-navy-ink/35 focus:border-red-stamp focus:ring-2 focus:ring-red-stamp/20" /><div className="mt-4 flex justify-end"><button onClick={sendReply} className="primary-button"><Send className="size-4" />Send reply</button></div></div>{notice && <div role="status" className="mt-5 text-sm text-navy-ink/70"><ShieldCheck className="mr-2 inline size-4 text-red-stamp" />{notice}</div>}
          </>}

          {view === 'replies' && <><div className="mb-9"><p className="eyebrow">Your mailbox</p><h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">Replies to your letters.</h1><p className="mt-4 text-base leading-7 text-navy-ink/65">Only replies to your anonymous serial numbers appear here.</p></div><div className="flex flex-col gap-5">{myReplies.map((item) => <article key={item.serial} className="paper-card p-6 md:p-8"><div className="mb-5 flex items-center justify-between text-sm"><span className="serial">{item.serial}</span><span className="text-navy-ink/45">Reply to {item.letterSerial} · {item.date}</span></div><p className="font-serif text-lg leading-8">{item.body}</p><div className="mt-6 flex justify-end"><button className="report-button"><Flag className="size-3.5" />Report</button></div></article>)}</div></>}
        </section>
      </div>
      <footer className="border-t border-navy-ink/10 px-5 py-8 text-center text-xs text-navy-ink/50">This is peer support, not professional help. If you are in immediate danger, contact local emergency services or a trusted person.</footer>
    </main>
  )
}
