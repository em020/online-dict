import React, { FC, useState, useEffect } from 'react'
import { ViewPorps } from '../../interface/IDictResult'

const MAX_GLOBAL_Q_ATTEMPTS = 10
const GLOBAL_Q_POLL_INTERVAL = 300

export const NetworktestView: FC<ViewPorps<any>> = ({ result }) => {
    const [responseText, setResponseText] = useState<string>('Click the button to see the result...')
    const [loading, setLoading] = useState(false)
    const [globalQ, setGlobalQ] = useState<string>('')

    useEffect(() => {
        let attempts = 0
        const poll = () => {
            const gq = (window as any).global_q
            if (typeof gq !== 'undefined' && gq !== null && gq !== '') {
                setGlobalQ(String(gq))
                return
            }
            if (++attempts < MAX_GLOBAL_Q_ATTEMPTS) {
                setTimeout(poll, GLOBAL_Q_POLL_INTERVAL)
            }
        }
        poll()
    }, [])

    const handleClick = () => {
        setLoading(true)
        setResponseText('Fetching...')
        fetch('https://www.yunzhijia.com/yzjai/ai/chain', {
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

    return (
        <div className="networktest-Container">
            <div id="networktest-global-q" className="networktest-GlobalQ">global_q: {globalQ}</div>
            <button className="networktest-Button" disabled={loading} onClick={handleClick}>
                {loading ? 'Loading...' : 'CLICK ME!'}
            </button>
            <div id="network-test-result" className="networktest-Result">
                {responseText}
            </div>
        </div>
    )
}
