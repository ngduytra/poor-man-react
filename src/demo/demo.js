import * as vd from './vd-demo.js'

const App = () => {
    const [count, setCount] = vd.useState(10)
    vd.useEffect(() => {
        console.log('app use effect')
        setInterval(() => {
            setCount(c => c + 1)
        }, 2000)
    }, [])

    return vd.div({},
        [
            vd.component(Header),
            vd.div({classNames: 'main'}, [
                vd.h2({}, 'Section 1'),
                vd.p({}, 'This is an example paragraph'),
                vd.h2({}, 'Section 2'),
                vd.p({}, `Feeling bored...? Here's the current count: ${count}`)
            ]),
            vd.component(Footer)
        ]
    )
}

const Header = () => {
    const [count, setCount] = vd.useState(10)
    vd.useEffect(() => {
        console.log('header use effect')
        setInterval(() => {
            setCount(c => c + 1)
        }, 2000)
    }, [])

    return vd.h1({classNames: ['header']},
        `Hello world - ${count}`
    )
}

const Footer = () => {
    return vd.div({classNames: ['footer']}, 'Footer')
}

vd.render(vd.component(App), document.getElementById('app'))
