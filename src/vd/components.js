export const INTERNAL_STATE = {
    app: null,
    domEl: null,
    renderingComponents: [],
    needsRendering: false
}

const domify = (component) => {
    if (component instanceof Component) {
        return component.render()
    } else {
        return document.createTextNode(String(component))
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

        // content passed in from parent
        this.content = content

        // components created in our rendering function
        this.cacheContent = {}

        // Cache states, effects, callbacks, ...
        this.states = []
        this.currentStateIndex = 0

        this.domEl = null
    }

    update (props, content) {
        this.props = props
        this.content = content
    }

    render () {
        INTERNAL_STATE.renderingComponents.push(this)
        let dom = this.htmlDom()
        INTERNAL_STATE.renderingComponents.pop()
        this.domEl = dom
        return this.domEl
    }

    htmlDom () {
        this.currentStateIndex = 0
        const childComponent = this.fn(this.props, this.content)
        let dom
        if (childComponent instanceof Component) {
            dom = childComponent.render()
        } else {
            dom = document.createTextNode(String(childComponent))
        }
        return dom
    }
}

class CoreComponent extends Component {
    constructor (name, props, content) {
        super(null, props, content)
        this.name = name
        const { classNames, eventListeners } = props
        this.classNames = classNames
        this.eventListeners = eventListeners || {}
        this.currentListeners = {}
    }

    update (props, content) {
        super.update(props, content)
        const { classNames, eventListeners } = props
        this.classNames = classNames
        this.eventListeners = eventListeners || {}
    }

    htmlDom () {
        if (!this.domEl) {
            this.domEl = document.createElement(this.name);
        }
        // Create/Update listeners as required from props
        for (const event of Object.keys(this.eventListeners)) {
            let handler = this.eventListeners[event]
            let currentHandler = this.currentListeners[event]
            if (handler !== currentHandler) {
                if (currentHandler) {
                    this.domEl.removeEventListener(event, currentHandler)
                }
                this.domEl.addEventListener(event, handler)
            }
        }

        // Create/Update props as needed
        let classNames = this.classNames || []
        if (typeof classNames === 'string') {
            classNames = [classNames]
        }
        this.domEl.className = classNames.join(',')

        // Populate content
        let htmlDom;
        if (this.content instanceof Array) {
            htmlDom = this.content.map(domify)
        } else {
            htmlDom = [domify(this.content)]
        }
        this.domEl.replaceChildren(...htmlDom)
        return this.domEl
    }
}

export function component(fn, props, id, content) {
    if (content === undefined) {
        content = id
        id = 'undefined'
    }

    let cacheKey, ComponentCls
    if (typeof fn === 'function') {
        cacheKey = `${fn.name}|${id}`
        ComponentCls = Component
    } else {
        cacheKey = `${fn}|${id}`
        ComponentCls = CoreComponent
    }

    const [current] = INTERNAL_STATE.renderingComponents.slice(-1)
    let component
    if (current && current.cacheContent[cacheKey]) {
        component = current.cacheContent[cacheKey]
        component.update(props, content)
    } else {
        component = new ComponentCls(fn, props, content)
        if (current) {
            current.cacheContent[cacheKey] = component
        }
    }
    return component
}

export function useState (initialValue) {
    const [current] = INTERNAL_STATE.renderingComponents.slice(-1)
    const idx = current.currentStateIndex
    let val, setVal
    if (current.states.length <= idx) {
        // 1st render - update states store
        val = initialValue
        if (typeof initialValue === 'function') {
            val = initialValue()
        }
        setVal = newVal => {
            const oldVal = current.states[idx][0]
            if (typeof newVal === 'function') {
                newVal = newVal(oldVal)
            }
            current.states[idx] = [newVal, setVal]
            if (oldVal !== newVal) {
                renderOnNextTick()
            }
        }
        current.states.push([val, setVal])
    } else {
        [val, setVal] = current.states[idx]
    }
    current.currentStateIndex += 1
    return [val, setVal]
}

export function useEffect (fn, dependents) {
    const [current] = INTERNAL_STATE.renderingComponents.slice(-1)
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

export function useCallback (fn, dependents) {
    const [current] = INTERNAL_STATE.renderingComponents.slice(-1)
    const idx = current.currentStateIndex
    if (current.states.length <= idx) {
        // 1st render - update states store
        current.states.push([fn, dependents])
    } else {
        let [currentFn, currentDependents] = current.states[idx]
        if (!arrayEqual(dependents, currentDependents)) {
            current.states[idx] = [fn, dependents]
            renderOnNextTick()
        } else {
            fn = currentFn
        }
    }
    current.currentStateIndex += 1
    return fn
}

function _render() {
    if (INTERNAL_STATE.needsRendering) {
        INTERNAL_STATE.needsRendering = false
        INTERNAL_STATE.domEl.replaceChildren(INTERNAL_STATE.app.render())
    }
}

function renderOnNextTick() {
    INTERNAL_STATE.needsRendering = true
    setTimeout(_render, 0)
}

export function render(component, domEl) {
    INTERNAL_STATE.app = component
    INTERNAL_STATE.domEl = domEl
    INTERNAL_STATE.needsRendering = true
    _render()
}
