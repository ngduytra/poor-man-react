import { component, useEffect, useState, useCallback, render } from './components.js'

export function div (props, id, content) {
    return component('div', props, id, content)
}

export function button (props, id, content) {
    return component('button', props, id, content)
}

export { component, useEffect, useState, useCallback, render }
