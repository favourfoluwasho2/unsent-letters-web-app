'use client'

import useSWR from 'swr'
import { useEffect, useRef, useState } from 'react'
import { Archive, ArrowRight, Feather, Flag, Heart, Mail, Mic, MicOff, PenLine, Send, ShieldCheck } from 'lucide-react'

type View = 'write' | 'read' | 'replies'
type Letter = { serial: string; date: string; body: string; replyCount: number; mood?: string }
type Reply = { serial: string; letterSerial: string; body: string; date: string }
type SpeechRecognitionInstance = { continuous: boolean; interimResults: boolean; lang: string; start: () => void; stop: () => void; onresult: ((event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null }
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

declare global {
  interface Window { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }
}

const demoLetters: Letter[] = [
  { serial: 'L-4821', date: 'October 7, 2026', mood: 'Feeling behind', body: 'I keep comparing the chapter I am living to everyone else’s highlight reel. Some days I feel behind, even though I know there is no single timeline for a life. I am trying to remember that quiet progress still counts.', replyCount: 12 },
  { serial: 'L-1742', date: 'Undated', mood: 'Lonely', body: 'I moved to a new city for a fresh start, but the quiet feels louder than I expected. I miss having people who know the small details. I hope I can be patient while I build something new here.', replyCount: 8 },
]
const myReplies: Reply[] = [
  { serial: 'R-1093', letterSerial: 'L-4821', body: 'You are not behind. The fact that you are still paying attention to your life is a kind of progress, even when it does not make a good highlight reel.', date: 'A few minutes ago' },
  { serial: 'R-7760', letterSerial: 'L-4821', body: 'Quiet progress absolutely counts. I hope you give yourself the same patience you would give someone you love.', date: 'Yesterday' },
]
const moods = ['Heavy', 'Lonely', 'Anxious', 'Missing someone', 'Hopeful', 'Just need to say it']
const starters = ["You&apos;re not alone in this.", 'Thank you for being brave enough to write this.', 'What you feel makes sense.', 'I hope tomorrow is a little lighter.']

export default function Page() {
  const { data: storedLetters, mutate } = useSWR<Letter[]>('/api/letters', (url: string) => fetch(url).then((response) => response.json()))
  const availableLetters = storedLetters?.length ? storedLetters : demoLetters
  const [view, setView] = useState<View>('write')
  const [letter, setLetter] = useState(availableLetters[0])
  const [body, setBody] = useState('')
  const [dated, setDated] = useState(false)
  const [mood, setMood] = useState('')
  const [reply, setReply] = useState('')
  const [notice, setNotice] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => () => recognitionRef.current?.stop(), [])

  function toggleDictation() {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return }
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Recognition) { setNotice('Voice typing is not supported in this browser. Try Chrome or Safari.'); return }
    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = navigator.language || 'en-US'
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).filter((result) => result.isFinal).map((result) => result[0].transcript).join(' ')
      if (transcript) setBody((current) => `${current}${current && !current.endsWith(' ') ? ' ' : ''}${transcript}`)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => { setIsListening(false); setNotice('We could not hear that. Please check microphone access and try again.') }
    recognitionRef.current = recognition
    setNotice('')
    setIsListening(true)
    recognition.start()
  }

  function navigate(next: View) { setView(next); setNotice('') }
  async function postLetter() {
    if (body.trim().length < 20) { setNotice('Please write at least 20 characters so a stranger has something to hold onto.'); return }
    const response = await fetch('/api/letters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body, dated, mood }) })
    if (!response.ok) { setNotice('We could not save your letter. Please try again.'); return }
    await mutate(); setNotice('Sent. Your letter is being read with care.'); setBody(''); setMood('')
  }
  function sendReply() {
    if (reply.trim().length < 20) { setNotice('Please write a little more so your encouragement can be helpful.'); return }
    setNotice('Sent. Thank you for showing up for someone.'); setReply('')
  }

  return <main className="min-h-screen pb-28">
    <header className="mx-auto flex max-w-[660px] items-center justify-between px-5 pb-6 pt-8 md:pt-12">
      <button className="brand" onClick={() => navigate('write')} aria-label="Go to write a letter"><span className="brand-mark"><Feather /></span><span><span className="block font-serif text-xl">Unsent Letters</span><span className="hidden text-xs text-muted md:block">A quiet place to be heard</span></span></button>
      <span className="hidden rounded-full border border-white/15 px-3 py-1.5 text-xs text-muted sm:block">Anonymous by design</span>
    </header>

    <section className="mx-auto max-w-[660px] px-5">
      {view === 'write' && <>
        <div className="hero"><p className="kicker">A quiet place to begin</p><h1>Say it here. Someone will listen.</h1><p>Write the thing you can&apos;t say out loud. A stranger will write back, just to say you&apos;re not alone.</p><div className="flex flex-wrap gap-2 pt-2"><span className="soft-chip">No names</span><span className="soft-chip">No accounts</span><span className="soft-chip">Serial numbers only</span></div></div>
        <div className="glass-panel breathing mt-8 p-5 sm:p-8"><div className="mb-7"><h2>How are you feeling tonight?</h2><div className="mt-4 flex flex-wrap gap-2">{moods.map((item) => <button key={item} onClick={() => setMood(mood === item ? '' : item)} className={`mood-chip ${mood === item ? 'mood-chip-selected' : ''}`}>{item}</button>)}</div></div><label htmlFor="letter" className="letter-label">Dear stranger,</label><div className="relative"><textarea id="letter" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Take your time. There's no right way to start." className="letter-input min-h-64 w-full resize-y pr-14" /><button type="button" onClick={toggleDictation} className={`dictation-button ${isListening ? 'dictation-button-active' : ''}`} aria-label={isListening ? 'Stop voice typing' : 'Start voice typing'} aria-pressed={isListening}>{isListening ? <MicOff /> : <Mic />}</button></div>{isListening && <p className="dictation-status" role="status"><span className="dictation-dot" />Listening… speak naturally, then pause when you&apos;re done.</p>}<div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between"><label className="flex cursor-pointer items-center gap-3 text-sm text-muted"><input type="checkbox" checked={dated} onChange={(e) => setDated(e.target.checked)} />Add today&apos;s date</label><button onClick={postLetter} className="primary-button"><Send />Send into the world</button></div></div>
        {notice && <Notice text={notice} />}
      </>}

      {view === 'read' && <><div className="hero compact"><p className="kicker">From someone out there</p><div className="flex items-end justify-between gap-4"><h1>A letter for you.</h1><button onClick={() => setLetter(availableLetters[(availableLetters.indexOf(letter) + 1) % availableLetters.length])} className="secondary-button shrink-0"><ArrowRight />Another letter</button></div></div><LetterCard letter={letter} /><div className="glass-panel mt-7 p-5 sm:p-7"><div className="mb-5 flex items-start gap-3"><Heart className="mt-1 text-rose" /><div><h2>Write back</h2><p className="mt-1 text-sm text-muted">Encourage, don&apos;t give orders or ask for personal details.</p></div></div><div className="flex flex-wrap gap-2">{starters.map((item) => <button key={item} className="starter-chip" onClick={() => setReply(item.replace('&apos;', "'"))}>{item.replace('&apos;', "'")}</button>)}</div><textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Your kind reply..." className="letter-input mt-5 min-h-32 w-full resize-y" /><div className="mt-4 flex justify-end"><button onClick={sendReply} className="primary-button"><Send />Send reply</button></div></div>{notice && <Notice text={notice} />}</>}

      {view === 'replies' && <><div className="hero compact"><p className="kicker">Your anonymous mailbox</p><h1>My replies.</h1><p>Replies to your letters, gathered here by serial number.</p></div><div className="flex flex-col gap-5">{myReplies.map((item) => <article key={item.serial} className="paper-card p-6 sm:p-8"><div className="mb-5 flex items-center justify-between text-sm"><span className="serial">{item.serial}</span><span className="text-muted">Reply to {item.letterSerial} · {item.date}</span></div><p className="font-serif text-lg leading-8 text-ink">{item.body}</p><button className="report-button mt-6"><Flag />Report</button></article>)}</div></>}
    </section>
    <footer className="mx-auto mt-16 max-w-[660px] px-5 text-center text-xs leading-6 text-muted">This is peer support, not professional help.</footer>
    <nav className="floating-nav" aria-label="Main navigation">{([['write', 'Write', PenLine], ['read', 'Read', Mail], ['replies', 'Replies', Archive]] as const).map(([key, label, Icon]) => <button key={key} onClick={() => navigate(key)} className={view === key ? 'floating-nav-active' : ''}><Icon />{label}</button>)}</nav>
  </main>
}

function Notice({ text }: { text: string }) { return <div role="status" className="glass-note mt-5"><ShieldCheck />{text}</div> }
function LetterCard({ letter }: { letter: Letter }) { return <article className="paper-card p-6 sm:p-10"><div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-5"><span className="serial">{letter.serial}</span>{letter.mood && <span className="mood-tag">{letter.mood}</span>}<span className="text-sm text-ink/60">{letter.date}</span></div><p className="whitespace-pre-wrap font-serif text-[17px] leading-[1.75] text-ink">{letter.body}</p><div className="mt-8 flex justify-end"><button className="report-button"><Flag />Report</button></div></article>}
