import * as vd from '../vd'
import { useEffect, useState, useCallback } from '../vd'

const App = () => {
    return vd.div({},
        [
            vd.component(Header),
            vd.div({classNames: 'main'}, 'body', [
                vd.component(LeftSection), vd.component(RightSection)
            ]),
            vd.component(Footer)
        ]
    )
}

const Header = () => {
    return vd.div({classNames: ['header']},
        [
            vd.div({classNames: ['left-header']}, 'left', 'My title'),
            vd.div({classNames: ['right-header']}, 'right', 'Right menu')
        ]
    )
}

const LeftSection = () => {
    const [count, setCount] = useState(10)
    const resetHandler = useCallback(() => {
        setCount(10)
    }, [])

    useEffect(() => {
        setInterval(() => {
            setCount(i => i + 1)
        }, 2000)
    }, [])

    return vd.div({classNames: ['left-section']}, 1, [
        vd.div({}, 2,`Left section: ${count}`),
        vd.button({
            eventListeners: {
                click: resetHandler
            }
        }, 'Reset')
    ])
}

const RightSection = () => {
    const [texts, setTexts] = useState([])
    const handler = useCallback(() => {
        const line = 'Lorem ipsum...'
        setTexts([
            line,
            ...texts
        ])
    }, [texts])

    return vd.div({classNames: ['right-section']}, 'main', [
        vd.div({}, 'text', 'Right section'),
        ...texts.map((text, idx) => {
            return vd.div({}, idx, `${idx}. ${text}`)
        }),
        vd.button({
            eventListeners: {
                click: handler
            },
        }, 'Add line')
    ])
}

const Footer = () => {
    return vd.div({classNames: ['footer']}, 'Footer')
}

vd.render(vd.component(App), document.getElementById('app'))
