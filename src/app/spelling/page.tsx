"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { ArrowLeft, Volume2, RotateCcw, CheckCircle2, XCircle, ChevronRight, Settings2, Trash2, Plus } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { DEFAULT_WORD_LISTS, speakWord, parseWordList, shuffleArray } from "@/lib/spelling-utils"

export default function SpellingPage() {
    const [difficulty, setDifficulty] = useState<keyof typeof DEFAULT_WORD_LISTS | "custom">("beginner")
    const [wordList, setWordList] = useState<string[]>(DEFAULT_WORD_LISTS.beginner)
    const [customList, setCustomList] = useState<string>("")
    const [wordIndex, setWordIndex] = useState(0)
    const [userInput, setUserInput] = useState("")
    const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null)
    const [score, setScore] = useState({ correct: 0, total: 0 })
    const [isFinished, setIsFinished] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [voicesLoaded, setVoicesLoaded] = useState(false)

    // Speech speed setting
    const [speechRate, setSpeechRate] = useState(0.8)

    const inputRef = useRef<HTMLInputElement>(null)

    const currentWord = wordList[wordIndex]

    // Ensure voices are loaded
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices()
            if (voices.length > 0) {
                setVoicesLoaded(true)
            }
        }
        
        loadVoices()
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices
        }
    }, [])

    const playWord = useCallback(() => {
        if (currentWord) {
            speakWord(currentWord, speechRate)
        }
    }, [currentWord, speechRate])

    const startNewSession = (diff: keyof typeof DEFAULT_WORD_LISTS | "custom", list?: string[]) => {
        const newList = list || (diff === "custom" ? parseWordList(customList) : DEFAULT_WORD_LISTS[diff as keyof typeof DEFAULT_WORD_LISTS])
        
        if (newList.length === 0) {
            alert("Please provide at least one word.")
            return
        }

        setWordList(shuffleArray(newList))
        setDifficulty(diff)
        setWordIndex(0)
        setUserInput("")
        setFeedback(null)
        setScore({ correct: 0, total: 0 })
        setIsFinished(false)
        setShowSettings(false)
    }

    const checkSpelling = () => {
        if (!userInput.trim()) return

        const isCorrect = userInput.trim().toLowerCase() === currentWord.toLowerCase()
        setFeedback(isCorrect ? "correct" : "incorrect")
        
        if (isCorrect) {
            setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }))
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
            })

            // Automatically move to next word after a delay
            setTimeout(() => {
                nextWord()
            }, 1500)
        } else {
            setScore(prev => ({ ...prev, total: prev.total + 1 }))
        }
    }

    const nextWord = () => {
        if (wordIndex < wordList.length - 1) {
            setWordIndex(prev => prev + 1)
            setUserInput("")
            setFeedback(null)
        } else {
            setIsFinished(true)
        }
    }

    useEffect(() => {
        if (wordIndex >= 0 && !feedback && !isFinished) {
            const timeout = setTimeout(playWord, 500)
            // Ensure input is focused
            inputRef.current?.focus()
            return () => clearTimeout(timeout)
        }
    }, [wordIndex, wordList, playWord, feedback, isFinished])

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
            {/* Header */}
            <header className="h-16 shrink-0 border-b border-border bg-card/50 backdrop-blur-xl flex items-center px-6 justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-secondary rounded-full transition-colors group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Spelling Practice</h1>
                </div>
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 hover:bg-secondary rounded-full transition-colors"
                >
                    <Settings2 size={20} />
                </button>
            </header>

            <main className="max-w-4xl mx-auto p-6 md:p-12">
                {isFinished ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-3xl p-12 text-center"
                    >
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 text-primary">
                            <CheckCircle2 size={48} />
                        </div>
                        <h2 className="text-4xl font-black mb-4">Complete!</h2>
                        <p className="text-xl text-muted-foreground mb-8">
                            You scored <span className="text-primary font-bold">{score.correct}</span> out of <span className="font-bold">{score.total}</span>
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => startNewSession(difficulty)}
                                className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={20} /> Try Again
                            </button>
                            <button
                                onClick={() => {
                                    setDifficulty("beginner")
                                    setIsFinished(false)
                                    setWordIndex(0)
                                    setScore({ correct: 0, total: 0 })
                                }}
                                className="px-8 py-3 bg-secondary text-secondary-foreground rounded-full font-bold hover:bg-secondary/80 transition-all"
                            >
                                Change Level
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-8">
                        {/* Progress */}
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Level: {difficulty}</span>
                                <h2 className="text-2xl font-black">Word {wordIndex + 1} of {wordList.length}</h2>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-black text-primary">{Math.round((score.correct / (score.total || 1)) * 100)}%</div>
                                <div className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Accuracy Score</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${((wordIndex + 1) / wordList.length) * 100}%` }}
                            />
                        </div>

                        {/* Main Interaction Area */}
                        <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                           <div className="relative z-10 flex flex-col items-center gap-12">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={playWord}
                                    className="w-32 h-32 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/20 transition-all group-hover:shadow-primary/40 relative"
                                >
                                    <Volume2 size={48} />
                                    <motion.div 
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute inset-0 border-4 border-primary/30 rounded-full"
                                    />
                                </motion.button>

                                <div className="w-full max-w-md space-y-6">
                                    <div className="relative">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    feedback ? nextWord() : checkSpelling()
                                                }
                                            }}
                                            placeholder="Type the word you hear..."
                                            disabled={feedback !== null}
                                            spellCheck={false}
                                            autoComplete="one-time-code"
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            inputMode="text"
                                            aria-autocomplete="none"
                                            data-form-type="other"
                                            className={`w-full text-center bg-secondary/50 border-2 rounded-2xl px-6 py-5 text-2xl font-bold focus:outline-none transition-all ${
                                                feedback === 'correct' ? 'border-green-500 bg-green-50' : 
                                                feedback === 'incorrect' ? 'border-red-500 bg-red-50' : 
                                                'border-transparent focus:border-primary'
                                            } ${feedback !== null ? 'text-foreground' : 'text-primary'}`}
                                            autoFocus
                                        />
                                        
                                        <AnimatePresence>
                                            {feedback && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="absolute -right-4 -top-4"
                                                >
                                                    {feedback === 'correct' ? (
                                                        <CheckCircle2 className="w-10 h-10 text-green-500 fill-white" />
                                                    ) : (
                                                        <XCircle className="w-10 h-10 text-red-500 fill-white" />
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="flex gap-4">
                                        {feedback === "incorrect" ? (
                                            <button
                                                onClick={nextWord}
                                                className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                            >
                                                Next Word <ChevronRight size={20} />
                                            </button>
                                        ) : feedback === "correct" ? (
                                            <div className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/20">
                                                Correct! <CheckCircle2 size={20} />
                                            </div>
                                        ) : (
                                            <button
                                                onClick={checkSpelling}
                                                disabled={!userInput}
                                                className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:grayscale"
                                            >
                                                Check Spelling
                                            </button>
                                        )}
                                        
                                        {feedback === 'incorrect' && (
                                            <button
                                                onClick={() => {
                                                    setUserInput("")
                                                    setFeedback(null)
                                                }}
                                                className="px-6 py-4 bg-secondary text-secondary-foreground rounded-2xl font-bold hover:bg-secondary/80 transition-colors"
                                            >
                                                <RotateCcw size={20} />
                                            </button>
                                        )}
                                    </div>

                                    {feedback === 'incorrect' && (
                                        <motion.p 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center text-red-500 font-medium"
                                        >
                                            Correct spelling: <span className="font-bold underline">{currentWord}</span>
                                        </motion.p>
                                    )}
                                </div>
                           </div>

                           {/* Decorative Elements */}
                           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                           <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mb-32 blur-3xl" />
                        </div>
                    </div>
                )}

                {/* Settings Overlay */}
                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm"
                            onClick={() => setShowSettings(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-card border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-bold">Settings</h3>
                                    <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                                        <XCircle size={20} />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Difficulty Level</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {(Object.keys(DEFAULT_WORD_LISTS) as (keyof typeof DEFAULT_WORD_LISTS)[]).map(level => (
                                                <button
                                                    key={level}
                                                    onClick={() => startNewSession(level)}
                                                    className={`py-3 px-4 rounded-xl border-2 font-bold capitalize transition-all ${
                                                        difficulty === level ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-secondary/50 hover:bg-secondary'
                                                    }`}
                                                >
                                                    {level}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setDifficulty("custom")}
                                                className={`py-3 px-4 rounded-xl border-2 font-bold capitalize transition-all ${
                                                    difficulty === "custom" ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-secondary/50 hover:bg-secondary'
                                                }`}
                                            >
                                                Custom
                                            </button>
                                        </div>
                                    </div>

                                    {difficulty === "custom" && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex justify-between items-center">
                                                Custom Word List
                                                <span className="text-[10px] lowercase normal-case text-muted-foreground/60">Comma or newline separated</span>
                                            </label>
                                            <textarea
                                                value={customList}
                                                onChange={(e) => setCustomList(e.target.value)}
                                                placeholder="e.g. apple, banana, cherry"
                                                className="w-full bg-secondary/50 border-2 border-transparent focus:border-primary rounded-xl p-4 min-h-[120px] focus:outline-none font-medium transition-all"
                                            />
                                            <button
                                                onClick={() => startNewSession("custom")}
                                                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                            >
                                                <Plus size={20} /> Start Custom Session
                                            </button>
                                        </div>
                                    )}

                                    <div className="space-y-4 pt-4 border-t border-border">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Speech Speed</label>
                                            <span className="text-primary font-bold">{speechRate.toFixed(1)}x</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="1.5"
                                            step="0.1"
                                            value={speechRate}
                                            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                                            className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                    
                                    <div className="pt-4 flex gap-3">
                                        <button
                                            onClick={() => startNewSession(difficulty)}
                                            className="flex-1 py-4 bg-secondary text-secondary-foreground rounded-xl font-bold hover:bg-secondary/80 transition-all flex items-center justify-center gap-2"
                                        >
                                            <RotateCcw size={18} /> Reset Current
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
