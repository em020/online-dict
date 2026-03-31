import React, { FC, useState, useEffect } from 'react'
import { ViewPorps } from '../../interface/IDictResult'

export const NetworktestView: FC<ViewPorps<any>> = ({ result }) => {
    const [responseText, setResponseText] = useState<string>('Click the button to see the result...')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        console.log(result)
    }, []);

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
        </div>
    )
}
