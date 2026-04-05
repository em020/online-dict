import React, { FC, useState, useEffect } from 'react'
import { ViewPorps } from '../../interface/IDictResult'

const buildSearchCmd = (word: string): string => {
    // if (typeof (window as any).eudic_generateSearchWordCmd === 'function') {
    //     return (window as any).eudic_generateSearchWordCmd(word)
    // }
    // return 'cmd://dict/searchword?word=' + encodeURIComponent(word)

    // sanitize reason: the eudic_clientCallback bridge seems does not like the '%', even url escaped won't do
    const sanitizedWord = word.replace(/%/g, ' percent')
    return `cmd://dict/searchword?word=${sanitizedWord}`
}

export const NetworktestView: FC<ViewPorps<any>> = ({ result }) => {
    const [responseText, setResponseText] = useState<string>('Click the button to see the result...')
    const [loading, setLoading] = useState(false)
    const [storedId, setStoredId] = useState<string | null>(null)
    const [isDivVisible, setIsDivVisible] = useState(false)

    useEffect(() => {
        console.log(result)
        const word = result.word
        const match = word && typeof word === 'string' ? word.match(/^Loading\.\.\.(.+)$/) : null

        if (match) {
            const objectId = match[1]
            sessionStorage.setItem('pending_cid_id', objectId)

            const delay = 210
            console.log('[networktest] Loading pattern detected. ID:', objectId)

            fetch(`http://127.0.0.1:8000/retrieve_string?key=${encodeURIComponent(objectId)}`)
                .then(res => res.json())
                .then(data => {
                    const rawValue = data.value || 'helloSSYYMM'
                    let reSearchWord: string
                    let displayPayload: string | null = null

                    const dualMatch = rawValue.match(/^(.+?)@@@(.+)$/)
                    if (dualMatch) {
                        reSearchWord = dualMatch[1].trim()
                        displayPayload = dualMatch[2].trim()
                        console.log(`[networktest] Dual pattern detected. Word: "${reSearchWord}", Payload: "${displayPayload}"`)
                    } else {
                        reSearchWord = rawValue
                        displayPayload = objectId
                    }

                    sessionStorage.setItem('pending_cid_id', displayPayload)

                    const cmd = buildSearchCmd(reSearchWord)

                    console.log(`[networktest] retrieved word: "${reSearchWord}". triggering auto re-search in ${delay}ms. Command:`, cmd)

                    setTimeout(() => {
                        console.log('[networktest] executing redirection now...')
                        if (typeof (window as any).eudic_clientCallback === 'function') {
                            (window as any).eudic_clientCallback(cmd)
                        } else {
                            window.location.href = cmd
                        }
                    }, delay)
                })
                .catch(err => {
                    console.error('[networktest] failed to retrieve string:', err)
                    // Fallback to placeholder if API fails
                    const reSearchWord = 'helloSSYYMM'
                    const cmd = buildSearchCmd(reSearchWord)

                    setTimeout(() => {
                        if (typeof (window as any).eudic_clientCallback === 'function') {
                            (window as any).eudic_clientCallback(cmd)
                        } else {
                            window.location.href = cmd
                        }
                    }, delay)
                })
        } else {
            const pendingId = sessionStorage.getItem('pending_cid_id')
            if (pendingId) {
                setStoredId(pendingId)
                sessionStorage.removeItem('pending_cid_id')
            }
        }
    }, [result.word]);

    const handleClick = () => {
        setLoading(true)
        setResponseText('Fetching...')
        fetch('https://www.yunzhijia.com/yzjai/ai/chain/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}'
        })
            .then(res => res.text())
            .then(text => {
                setResponseText(text)
                setLoading(false)
            })
            .catch(err => {
                setResponseText('Error: ' + err.message)
                setLoading(false)
            })
    }

    const handleClick2 = () => {
        console.log("button 2 clicked")
        setIsDivVisible(!isDivVisible)
    }

    return (
        <div className="networktest-Container nt-space-y-3">
            <div id="networktest-global-q" className="networktest-GlobalQ nt-font-bold">{result.word}</div>
            <button className="networktest-Button nt-inline-flex nt-items-center nt-justify-center" disabled={loading}
                    onClick={handleClick}>
                {loading ? 'Loading...' : 'CLICK ME!'}
            </button>
            <div id="network-test-result" className="nt-break-all">
                {responseText}
            </div>
            <button className="networktest-Button nt-inline-flex nt-items-center nt-justify-center"
                    onClick={handleClick2}>
                {'BUTTON 2'}
            </button>
            {storedId && (
                <div className="networktest-StoredId nt-mt-2 nt-p-2 nt-bg-gray-100 nt-rounded">
                    Stored ID: {storedId}
                </div>
            )}
            {isDivVisible && (
                <div className="nt-h-[300px] nt-bg-gray-100 nt-border nt-border-gray-300 nt-mt-2.5">
                    This is a 300px fixed height div.
                </div>
            )}
        </div>
    )
}
