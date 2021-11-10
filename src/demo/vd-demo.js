const renderingComponents = []

const domify = (content) => {
    if (content instanceof Component) {
        return content.render()
    } else {
        return document.createTextNode(String(content))
    }
}

function arrayEqual (arr1, arr2) {
    if (arr1.length !== arr2.length) return false
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false
    }
    return true
}

class Component {
    constructor (fn, props, content) {
        this.fn = fn
        this.props = props
        this.content = content
        this.states = []
        this.currentStateIndex = 0
    }

    render () {
        renderingComponents.push(this)
        this.currentStateIndex = 0
        const childComponent = this.fn(this.props, this.content)
        renderingComponents.pop()
        return domify(childComponent)
    }
}

class CoreComponent extends Component {
    constructor (name, props, content) {
        super(null, props, content)
        this.name = name
        const { classNames } = props
        this.classNames = classNames
    }

    render () {
        let domEl = document.createElement(this.name);

        // Create/Update props as needed
        let classNames = this.classNames || []
        if (typeof classNames === 'string') {
            classNames = [classNames]
        }
        domEl.className = classNames.join(',')

        // Populate content
        let htmlDom;
        if (this.content instanceof Array) {
            htmlDom = this.content.map(domify)
        } else {
            htmlDom = [domify(this.content)]
        }
        domEl.replaceChildren(...htmlDom)
        return domEl
    }
}

export function component (fn, props, content) {
    if (typeof fn === 'function') {
        return new Component(fn, props, content)
    } else {
        return new CoreComponent(fn, props, content)
    }
}

export function div (props, content) {
    return component('div', props, content)
}

export function p (props, content) {
    return component('p', props, content)
}

export function h1 (props, content) {
    return component('h1', props, content)
}

export function h2 (props, content) {
    return component('h2', props, content)
}

export function render(component, domEl) {
    domEl.replaceChildren(component.render())
    setInterval(() => {
        domEl.replaceChildren(component.render())
    }, 1000)
}

export function useState (initialValue) {
    const [current] = renderingComponents.slice(-1)
    const idx = current.currentStateIndex
    let val, setVal
    if (current.states.length <= idx) {
        // 1st render - update states store
        val = initialValue
        if (typeof initialValue === 'function') {
            val = initialValue()
        }
        setVal = _val => {
            if (typeof _val === 'function') {
                _val = _val(current.states[idx][0])
            }
            current.states[idx] = [_val, setVal]
        }
        current.states.push([val, setVal])
    } else {
        [val, setVal] = current.states[idx]
    }
    current.currentStateIndex += 1
    return [val, setVal]
}

export function useEffect (fn, dependents) {
    const [current] = renderingComponents.slice(-1)
    const idx = current.currentStateIndex
    if (current.states.length <= idx) {
        // 1st render - update states store
        current.states.push([fn, dependents, fn()])
    } else {
        let [_, currentDependents, cleanUp] = current.states[idx]
        if (!arrayEqual(dependents, currentDependents)) {
            if (typeof cleanUp === 'function') {
                cleanUp()
            }
            current.states[idx] = [fn, dependents, fn()]
        }
    }
    current.currentStateIndex += 1
}
