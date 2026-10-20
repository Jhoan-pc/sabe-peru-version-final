/**
 * Lightweight, zero-dependency Mock DOM & Event Simulator for Node.js
 * Enables opaque-box testing of UI components, DOM transitions, and user journeys.
 */

export class MockElement {
  constructor(tagName = 'div', attributes = {}) {
    this.tagName = tagName.toUpperCase();
    this.attributes = { ...attributes };
    this.children = [];
    this.parentElement = null;
    this.textContent = '';
    this.classList = new MockClassList(this);
    this.style = {};
    this.eventListeners = {};
    this.disabled = false;
    this.value = '';
    this.required = false;
    this.min = '';
    this.max = '';
  }

  get id() {
    return this.attributes['id'] || '';
  }
  set id(val) {
    this.attributes['id'] = val;
  }

  get className() {
    return this.attributes['class'] || '';
  }
  set className(val) {
    this.attributes['class'] = val;
    this.classList._syncFromClassName(val);
  }

  get src() {
    return this.attributes['src'] || '';
  }
  set src(val) {
    this.attributes['src'] = val;
  }

  get href() {
    return this.attributes['href'] || '';
  }
  set href(val) {
    this.attributes['href'] = val;
  }

  get alt() {
    return this.attributes['alt'] || '';
  }
  set alt(val) {
    this.attributes['alt'] = val;
  }

  get type() {
    return this.attributes['type'] || '';
  }
  set type(val) {
    this.attributes['type'] = val;
  }

  get name() {
    return this.attributes['name'] || '';
  }
  set name(val) {
    this.attributes['name'] = val;
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  setAttribute(name, val) {
    this.attributes[name] = String(val);
    if (name === 'class') this.classList._syncFromClassName(val);
    if (name === 'id') this.id = val;
  }

  removeAttribute(name) {
    delete this.attributes[name];
    if (name === 'class') this.classList._syncFromClassName('');
  }

  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name);
  }

  appendChild(child) {
    if (!child) return;
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentElement = null;
    }
    return child;
  }

  remove() {
    if (this.parentElement) {
      this.parentElement.removeChild(this);
    }
  }

  get innerHTML() {
    return this.children.map(c => c.outerHTML).join('') || this.textContent;
  }

  set innerHTML(html) {
    this.children = [];
    if (!html) {
      this.textContent = '';
      return;
    }
    this.textContent = html.replace(/<[^>]+>/g, '').trim();
    const tagRegex = /<([a-z0-9-]+)([^>]*)>([\s\S]*?)<\/\1>|<([a-z0-9-]+)([^>]*)\/?>/gi;
    let match;
    while ((match = tagRegex.exec(html)) !== null) {
      const tag = match[1] || match[4];
      const attrStr = match[2] || match[5] || '';
      const inner = match[3] || '';
      const el = new MockElement(tag);
      parseAttributes(attrStr, el);
      if (inner) el.innerHTML = inner;
      this.appendChild(el);
    }
  }

  get outerHTML() {
    const attrs = Object.entries(this.attributes)
      .map(([k, v]) => ` ${k}="${v}"`)
      .join('');
    const tag = this.tagName.toLowerCase();
    return `<${tag}${attrs}>${this.innerHTML}</${tag}>`;
  }

  addEventListener(type, handler) {
    if (!this.eventListeners[type]) this.eventListeners[type] = [];
    this.eventListeners[type].push(handler);
  }

  removeEventListener(type, handler) {
    if (!this.eventListeners[type]) return;
    this.eventListeners[type] = this.eventListeners[type].filter(h => h !== handler);
  }

  dispatchEvent(event) {
    event.target = this;
    event.currentTarget = this;
    const handlers = this.eventListeners[event.type] || [];
    for (const h of handlers) {
      h.call(this, event);
    }
    return !event.defaultPrevented;
  }

  click() {
    const evt = new MockEvent('click');
    return this.dispatchEvent(evt);
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    const traverse = (node) => {
      for (const child of node.children) {
        if (matchesSelector(child, selector)) {
          results.push(child);
        }
        traverse(child);
      }
    };
    traverse(this);
    return results;
  }
}

class MockClassList {
  constructor(element) {
    this.element = element;
    this._classes = new Set();
  }

  _syncFromClassName(className = '') {
    this._classes = new Set(className.split(/\s+/).filter(Boolean));
  }

  _syncToClassName() {
    this.element.attributes['class'] = Array.from(this._classes).join(' ');
  }

  add(...tokens) {
    for (const t of tokens) if (t) this._classes.add(t);
    this._syncToClassName();
  }

  remove(...tokens) {
    for (const t of tokens) this._classes.delete(t);
    this._syncToClassName();
  }

  toggle(token) {
    if (this._classes.has(token)) {
      this.remove(token);
      return false;
    } else {
      this.add(token);
      return true;
    }
  }

  contains(token) {
    return this._classes.has(token);
  }
}

export class MockEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.bubbles = !!init.bubbles;
    this.cancelable = !!init.cancelable;
    this.defaultPrevented = false;
    this.target = null;
    this.currentTarget = null;
  }

  preventDefault() {
    this.defaultPrevented = true;
  }

  stopPropagation() {}
}

export class MockDocument {
  constructor() {
    this.body = new MockElement('body');
    this.head = new MockElement('head');
    this.documentElement = new MockElement('html');
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
  }

  createElement(tag) {
    return new MockElement(tag);
  }

  getElementById(id) {
    const traverse = (node) => {
      if (node.id === id) return node;
      for (const child of node.children) {
        const found = traverse(child);
        if (found) return found;
      }
      return null;
    };
    return traverse(this.documentElement);
  }

  querySelector(selector) {
    return this.documentElement.querySelector(selector);
  }

  querySelectorAll(selector) {
    return this.documentElement.querySelectorAll(selector);
  }
}

function parseAttributes(attrStr, element) {
  const attrRegex = /([a-z0-9_-]+)(?:=["']([^"']*)["'])?/gi;
  let match;
  while ((match = attrRegex.exec(attrStr)) !== null) {
    const key = match[1];
    const val = match[2] !== undefined ? match[2] : '';
    element.setAttribute(key, val);
  }
}

function matchesSelector(element, selector) {
  if (!selector) return false;
  selector = selector.trim();

  // ID selector #foo
  if (selector.startsWith('#')) {
    return element.id === selector.substring(1);
  }

  // Pure classes or multiple classes: .foo or .foo.bar
  if (selector.startsWith('.')) {
    const requiredClasses = selector.split('.').filter(Boolean);
    return requiredClasses.every(c => element.classList.contains(c));
  }

  // Tag with classes: tag.foo or tag.foo.bar
  const tagClassMatch = selector.match(/^([a-z0-9-]+)(\.[a-z0-9_.-]+)$/i);
  if (tagClassMatch) {
    const [, tag, classPart] = tagClassMatch;
    if (element.tagName.toLowerCase() !== tag.toLowerCase()) return false;
    const requiredClasses = classPart.split('.').filter(Boolean);
    return requiredClasses.every(c => element.classList.contains(c));
  }

  // Tag selector
  if (/^[a-z0-9-]+$/i.test(selector)) {
    return element.tagName.toLowerCase() === selector.toLowerCase();
  }

  // Attribute selector [name="val"] or [name]
  const attrMatch = selector.match(/^\[([a-z0-9_-]+)(?:=["']?([^"']*)["']?)?\]$/i);
  if (attrMatch) {
    const [, attr, val] = attrMatch;
    if (!element.hasAttribute(attr)) return false;
    return val === undefined || element.getAttribute(attr) === val;
  }

  return false;
}

/**
 * Parses raw HTML string into MockDocument
 * @param {string} html
 * @returns {MockDocument}
 */
export function parseHtmlToMockDocument(html) {
  const doc = new MockDocument();
  const tagPattern = /<([a-z0-9-]+)([^>]*)>([\s\S]*?)<\/\1>|<([a-z0-9-]+)([^>]*)\/?>/gi;
  let m;
  while ((m = tagPattern.exec(html)) !== null) {
    const tag = m[1] || m[4];
    const attrs = m[2] || m[5] || '';
    const el = doc.createElement(tag);
    parseAttributes(attrs, el);
    doc.body.appendChild(el);
  }
  return doc;
}
