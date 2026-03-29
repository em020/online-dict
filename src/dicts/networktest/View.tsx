import React, { FC } from 'react'
import { ViewPorps } from '../../interface/IDictResult'
import './style.scss'

export const NetworktestView: FC<ViewPorps<any>> = ({ result }) => {
    return (
        <div className="networktest-Container">
            <div id="networktest-global-q" className="networktest-GlobalQ">global_q: </div>
            <button className="networktest-Button" eudic-onlinedict-custom-onclick="onNetworkTestClick">CLICK ME!</button>
            <div id="network-test-result" className="networktest-Result">
                Click the button to see the result...
            </div>
        </div>
    )
}
