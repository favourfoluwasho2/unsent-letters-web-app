'use client'

import useSWR from 'swr'
import { useEffect, useRef, useState } from 'react'
import { Archive, ArrowRight, Feather, Flag, Heart, Mail, Mic, MicOff, PenLine, Send, ShieldCheck, Shuffle, TreePine } from 'lucide-react'

type View = 'write' | 'read' | 'replies'
type Letter = { serial: string; date: string; body: string; replyCount: number; mood?: string; treeX?: number; treeY?: number; fruitSize?: 'small' | 'medium' | 'large' }
type Reply = { id?: string; serial: string; letterSerial: string; parentReplyId?: string | null; body: string; date: string }
type SpeechRecognitionInstance = { continuous: boolean; interimResults: boolean; lang: string; start: () => void; stop: () => void; onresult: ((event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null }
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

declare global {
  interface Window { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }
}

const moods = ['Heavy', 'Lonely', 'Anxious', 'Missing someone', 'Hopeful', 'Just need to say it']

const demoLetters: Letter[] = [
  { serial: 'L-4821', date: 'October 7, 2026', mood: 'Feeling behind', body: 'I keep comparing the chapter I am living to everyone else’s highlight reel. Some days I feel behind, even though I know there is no single timeline for a life. I am trying to remember that quiet progress still counts.', replyCount: 12 },
  { serial: 'L-1742', date: 'Undated', mood: 'Lonely', body: 'I moved to a new city for a fresh start, but the quiet feels louder than I expected. I miss having people who know the small details. I hope I can be patient while I build something new here.', replyCount: 8 },
  { serial: 'L-6308', date: 'October 4, 2026', mood: 'Hopeful', body: 'Today I noticed a tiny moment of peace between two hard things. I am learning that hope does not have to be loud to be real.', replyCount: 4 },
  { serial: 'L-2917', date: 'Undated', mood: 'Anxious', body: 'I am tired of pretending I know exactly what I am doing. Maybe being uncertain is not the same as being lost.', replyCount: 3 },
  { serial: 'L-8054', date: 'September 29, 2026', mood: 'Missing someone', body: 'I wish I could tell them that I still carry the good parts with me. I am trying to make room for the missing without letting it take every room.', replyCount: 6 },
  ...Array.from({ length: 20 }, (_, index): Letter => ({
    serial: `L-${String(9100 - index * 37).padStart(4, '0')}`,
    date: index % 3 === 0 ? 'Undated' : `September ${28 - (index % 17)}, 2026`,
    mood: moods[index % moods.length],
    body: [
      'I am writing this because saying it out loud still feels too big. I hope putting it somewhere gentle makes the next step feel possible.',
      'There is more tenderness in my life than I remember when I am having a difficult day. I am trying to notice one small thing at a time.',
      'I do not need an answer as much as I need to know that this feeling can exist without making me unworthy of care.',
    ][index % 3],
    replyCount: index % 9,
    treeX: [12, 24, 38, 56, 70, 84, 18, 47, 63, 78, 30, 52, 90, 8, 43, 68, 26, 58, 74, 36][index],
    treeY: [29, 22, 34, 18, 31, 25, 43, 27, 39, 20, 48, 44, 36, 52, 45, 49, 56, 58, 53, 60][index],
    fruitSize: index % 5 === 0 ? 'large' : index % 3 === 0 ? 'small' : 'medium',
  })),
]
const myReplies: Reply[] = [
  { serial: 'R-1093', letterSerial: 'L-4821', body: 'You are not behind. The fact that you are still paying attention to your life is a kind of progress, even when it does not make a good highlight reel.', date: 'A few minutes ago' },
  { serial: 'R-7760', letterSerial: 'L-4821', body: 'Quiet progress absolutely counts. I hope you give yourself the same patience you would give someone you love.', date: 'Yesterday' },
]
const starters = ["You&apos;re not alone in this.", 'Thank you for being brave enough to write this.', 'What you feel makes sense.', 'I hope tomorrow is a little lighter.']

export default function Page() {
  const { data: storedLetters, mutate } = useSWR<Letter[]>('/api/letters', (url: string) => fetch(url).then((response) => response.json()))
  const availableLetters = storedLetters?.length ? storedLetters : demoLetters
  const [view, setView] = useState<View>('write')
  const [letter, setLetter] = useState(availableLetters[0])
  const [openedLetters, setOpenedLetters] = useState<string[]>(availableLetters[0]?.serial ? [availableLetters[0].serial] : [])
  const { data: thread = [], mutate: mutateThread } = useSWR<Reply[]>(letter?.serial ? `/api/replies?letter=${encodeURIComponent(letter.serial)}` : null, (url: string) => fetch(url).then((response) => response.ok ? response.json() : []))

  useEffect(() => {
    if (storedLetters?.length) {
      setLetter((current) => storedLetters.find((item) => item.serial === current?.serial) ?? storedLetters[0])
    }
  }, [storedLetters])
  const [body, setBody] = useState('')
  const [dated, setDated] = useState(false)
  const [mood, setMood] = useState('')
  const [reply, setReply] = useState('')
  const [replyTo, setReplyTo] = useState<Reply | null>(null)
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

  function pickLetter(next: Letter) {
    setLetter(next)
    setOpenedLetters((current) => current.includes(next.serial) ? current : [...current, next.serial])
    setNotice('')
  }
  function pickRandomLetter() {
    const unopened = availableLetters.filter((item) => !openedLetters.includes(item.serial))
    if (unopened.length === 0) { setNotice('You have opened every letter on this tree. Check back soon for a new one.'); return }
    pickLetter(unopened[Math.floor(Math.random() * unopened.length)])
  }
  function navigate(next: View) { setView(next); setNotice('') }
  async function postLetter() {
    if (body.trim().length < 20) { setNotice('Please write at least 20 characters so a stranger has something to hold onto.'); return }
    const response = await fetch('/api/letters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body, dated, mood }) })
    if (!response.ok) { setNotice('We could not save your letter. Please try again.'); return }
    await mutate(); setNotice('Sent. Your letter is being read with care.'); setBody(''); setMood('')
  }
  async function sendReply() {
    if (reply.trim().length < 20) { setNotice('Please write a little more so your encouragement can be helpful.'); return }
    const response = await fetch('/api/replies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ letterSerial: letter.serial, body: reply, parentReplySerial: replyTo?.serial }) })
    if (!response.ok) { setNotice('We could not send your reply. Please try again.'); return }
    await mutateThread(); setNotice('Sent. Your place in this conversation is anonymous.'); setReply(''); setReplyTo(null)
  }

  return <main className="min-h-screen pb-28">
    <header className="mx-auto flex max-w-[660px] items-center justify-between px-5 pb-6 pt-8 md:pt-12">
      <button className="brand" onClick={() => navigate('write')} aria-label="Go to write a letter"><span className="brand-mark"><Feather /></span><span><span className="block font-serif text-xl">Unsent Letters</span><span className="hidden text-xs text-muted md:block">A quiet place to be heard</span></span></button>
      <span className="hidden rounded-full border border-white/15 px-3 py-1.5 text-xs text-muted sm:block">Anonymous by design</span>
    </header>

    <section className="mx-auto max-w-[660px] px-5">
      {view === 'write' && <>
        <div className="hero"><p className="kicker">No performance. Just you.</p><h1>Get it out of your head.</h1><p>Drop the thought, the rant, the thing you keep replaying. No names. No profiles. Just a place to be real, and maybe find a stranger who gets it.</p><div className="flex flex-wrap gap-2 pt-2"><span className="soft-chip">Low pressure</span><span className="soft-chip">Fully anonymous</span><span className="soft-chip">Human replies</span></div></div>
        <div className="glass-panel breathing mt-8 p-5 sm:p-8"><div className="mb-7"><h2>What&apos;s taking up space?</h2><div className="mt-4 flex flex-wrap gap-2">{moods.map((item) => <button key={item} onClick={() => setMood(mood === item ? '' : item)} className={`mood-chip ${mood === item ? 'mood-chip-selected' : ''}`}>{item}</button>)}</div></div><label htmlFor="letter" className="letter-label">Dear stranger,</label><div className="relative"><textarea id="letter" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Take your time. There's no right way to start." className="letter-input min-h-64 w-full resize-y pr-14" /><button type="button" onClick={toggleDictation} className={`dictation-button ${isListening ? 'dictation-button-active' : ''}`} aria-label={isListening ? 'Stop voice typing' : 'Start voice typing'} aria-pressed={isListening}>{isListening ? <MicOff /> : <Mic />}</button></div>{isListening && <p className="dictation-status" role="status"><span className="dictation-dot" />Listening… speak naturally, then pause when you&apos;re done.</p>}<div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between"><label className="flex cursor-pointer items-center gap-3 text-sm text-muted"><input type="checkbox" checked={dated} onChange={(e) => setDated(e.target.checked)} />Add today&apos;s date</label><button onClick={postLetter} className="primary-button"><Send />Send into the world</button></div></div>
        {notice && <Notice text={notice} />}
      </>}

      {view === 'read' && <><div className="hero compact"><p className="kicker">The internet, but softer</p><h1>Find a thought that feels familiar.</h1><p>Random words from real people. No feeds to doomscroll. Open one, sit with it, and leave a little kindness if you want.</p></div><section className="window-wall-panel" aria-labelledby="tree-heading"><div className="tree-heading"><div><p className="kicker">Pick a signal</p><h2 id="tree-heading">Someone out there said this.</h2><div className="window-counts"><span>{availableLetters.filter((item) => !openedLetters.includes(item.serial)).length} unread</span><span>{availableLetters.filter((item) => openedLetters.includes(item.serial)).length} read</span></div></div><button onClick={pickRandomLetter} className="primary-button surprise-button"><Shuffle />Give me a random one</button></div><div className="tree-stage" role="group" aria-label="Letter wall. Lit windows are unread letters. Dark windows are letters you have read."><div className="tree-canopy" aria-hidden="true" /><div className="tree-trunk" aria-hidden="true"><TreePine /></div><div className="tree-fruits">{availableLetters.slice(0, 24).filter((item) => !openedLetters.includes(item.serial)).map((item, index) => <button key={item.serial} style={{ '--tree-x': `${item.treeX ?? [14, 28, 43, 61, 78][index % 5]}%`, '--tree-y': `${item.treeY ?? 24 + (index % 4) * 9}%` } as Record<string, string>} className={`letter-fruit fruit-${index % 5} fruit-size-${item.fruitSize ?? 'medium'}`} onClick={() => pickLetter(item)} aria-label={`Unread letter, ${item.serial}`}><span>{item.serial}</span></button>)}</div><div className="tree-roots">{availableLetters.filter((item) => openedLetters.includes(item.serial)).map((item) => <button key={item.serial} className={`letter-root ${letter?.serial === item.serial ? 'letter-root-active' : ''}`} onClick={() => pickLetter(item)}><span>{item.serial}</span><small>read</small></button>)}</div></div><div className="tree-legend"><span><i className="legend-fruit" />Unread</span><span><i className="legend-root" />Read</span><span className="text-muted">{openedLetters.length} of {availableLetters.length} opened</span></div></section><LetterCard letter={letter} />{thread.length > 0 && <section className="mt-7" aria-labelledby="conversation-heading"><div className="mb-4 flex items-center justify-between"><h2 id="conversation-heading">A conversation in progress</h2><span className="text-xs text-muted">{thread.length} {thread.length === 1 ? 'reply' : 'replies'}</span></div><div className="flex flex-col gap-3">{thread.map((item) => <article key={item.id ?? item.serial} className={`reply-card ${item.parentReplyId ? 'reply-card-nested' : ''}`}><div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted"><span className="serial">{item.serial}</span><span>{item.date}</span></div><p className="font-serif leading-7 text-ink">{item.body}</p><button className="reply-link mt-3" onClick={() => { setReplyTo(item); setReply('') }}>Reply to this response <ArrowRight /></button></article>)}</div></section>}<div className="glass-panel mt-7 p-5 sm:p-7"><div className="mb-5 flex items-start gap-3"><Heart className="mt-1 text-rose" /><div><h2>{replyTo ? `Reply to ${replyTo.serial}` : 'Write back'}</h2><p className="mt-1 text-sm text-muted">Encourage, don&apos;t give orders or ask for personal details.</p></div></div>{replyTo && <button className="reply-cancel" onClick={() => setReplyTo(null)}>Cancel reply</button>}<div className="flex flex-wrap gap-2">{starters.map((item) => <button key={item} className="starter-chip" onClick={() => setReply(item.replace('&apos;', "'"))}>{item.replace('&apos;', "'")}</button>)}</div><textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={replyTo ? `Continue the conversation with ${replyTo.serial}...` : 'Your kind reply...'} className="letter-input mt-5 min-h-32 w-full resize-y" /><div className="mt-4 flex justify-end"><button onClick={sendReply} className="primary-button"><Send />Send reply</button></div></div>{notice && <Notice text={notice} />}</>}

      {view === 'replies' && <><div className="hero compact"><p className="kicker">Your anonymous mailbox</p><h1>My replies.</h1><p>Replies to your letters, gathered here by serial number.</p></div><div className="flex flex-col gap-5">{myReplies.map((item) => <article key={item.serial} className="paper-card p-6 sm:p-8"><div className="mb-5 flex items-center justify-between text-sm"><span className="serial">{item.serial}</span><span className="text-muted">Reply to {item.letterSerial} · {item.date}</span></div><p className="font-serif text-lg leading-8 text-ink">{item.body}</p><button className="report-button mt-6"><Flag />Report</button></article>)}</div></>}
    </section>
    <footer className="mx-auto mt-16 max-w-[660px] px-5 text-center text-xs leading-6 text-muted">This is peer support, not professional help.</footer>
    <nav className="floating-nav" aria-label="Main navigation">{([['write', 'Write', PenLine], ['read', 'Read', Mail], ['replies', 'Replies', Archive]] as const).map(([key, label, Icon]) => <button key={key} onClick={() => navigate(key)} className={view === key ? 'floating-nav-active' : ''}><Icon />{label}</button>)}</nav>
  </main>
}

function Notice({ text }: { text: string }) { return <div role="status" className="glass-note mt-5"><ShieldCheck />{text}</div> }
function LetterCard({ letter }: { letter: Letter }) { return <article className="paper-card p-6 sm:p-10"><div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-5"><span className="serial">{letter.serial}</span>{letter.mood && <span className="mood-tag">{letter.mood}</span>}<span className="text-sm text-ink/60">{letter.date}</span></div><p className="whitespace-pre-wrap font-serif text-[17px] leading-[1.75] text-ink">{letter.body}</p><div className="mt-8 flex justify-end"><button className="report-button"><Flag />Report</button></div></article>}
