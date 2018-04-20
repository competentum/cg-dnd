import merge from 'merge';
import cgUtils from 'cg-component-utils';
import utils from '../utils';

/**
 * @typedef {Object} DefaultDndElementSettings
 * @property {Element} node - html-node of dnd element.
 * @property {*} data - unique data
 * @property {string} ariaLabel
 * @property {string} className - css class name selector
 */

/**
 * Accessible drag/drop element Component
 */
class DefaultDndElement {
  /**
   *DefaulDndElement's customizing settings
   * @type {DefaultDndElementSettings}
   * @static
   */
  static get DEFAULT_SETTINGS() {
    if (!this._DEFAULT_SETTINGS) {
      this._DEFAULT_SETTINGS = {
        node: '',
        data: null,
        ariaLabel: '',
        className: ''
      };
    }

    return this._DEFAULT_SETTINGS;
  }

  static get ARIA_ATTRIBUTES() {
    return {
      ariaLabel: 'aria-label',
      ariaDescribedBy: 'aria-describedby',
      ariaLabelledBy: 'aria-labelledby'
    };
  }

  static get DND_ELEM_KIND() {
    return 'drag-item';
  }

  static get ID_UNIQUE_COUNTER() {
    if (!this._idUniqueCounter) {
      this._idUniqueCounter = 0;
    }

    return this._idUniqueCounter;
  }

  static set ID_UNIQUE_COUNTER(number) {
    this._idUniqueCounter = number;
  }

  /**
   * Unique IDs for aria descriptions elements
   * @return {{KEYBOARD_ACCESS_DEC: string, CURRENT_STATE_DESC: string}} id for current desc and keyboard desc elements
   */
  static get ARIA_DESC_IDS() {
    return {
      KEYBOARD_ACCESS_DEC: `${this.DND_ELEM_KIND}-keyboard-description-${this.ID_UNIQUE_COUNTER}`,
      CURRENT_STATE_DESC: `${this.DND_ELEM_KIND}-current-state-description-${this.ID_UNIQUE_COUNTER}`
    };
  }

  constructor(settings) {
    this._applySettings(settings);
    this._getDefaultCoordinates();

    this.siblings = {};

    /**
     * Fix for IE + JAWS. Otherwise, JAWS doesn't read description text
     */
    if (utils.IS_IE) {
      this.node.setAttribute('role', 'presentation');
    }
  }

  /**
   * Own interactive handlers (for future destroying)
   * */

  set onKeyDownHandler(handler) {
    this._onKeyDownHandler = typeof handler === 'function' ? handler : () => {};
  }

  get onKeyDownHandler() {
    if (!this._onKeyDownHandler) {
      this._onKeyDownHandler = () => {};
    }

    return this._onKeyDownHandler;
  }

  set onClickHandler(handler) {
    this._onClickHandler = typeof handler === 'function' ? handler : () => {};
  }

  get onClickHandler() {
    if (!this._onClickHandler) {
      this._onClickHandler = () => {};
    }

    return this._onClickHandler;
  }

  set onMouseDownHandler(handler) {
    this._onMouseDownHandler = typeof handler === 'function' ? handler : () => {};
  }

  get onMouseDownHandler() {
    if (!this._onMouseDownHandler) {
      this._onMouseDownHandler = () => {};
    }

    return this._onMouseDownHandler;
  }

  /**
   *  Set html-node of keyboard aria description
   * @param {Element|string} node
   */
  set keyboardDescElement(node) {
    this._keyboardDescElement = utils.getElement(node);
  }

  /**
   * @return {Element|string} node
   */
  get keyboardDescElement() {
    return this._keyboardDescElement;
  }

  /**
   *  Set html-node, which will contains current element state aria description
   * @param {Element|string} node
   */
  set currentStateDescElement(node) {
    this._currentStateDescElement = utils.getElement(node);
  }

  /**
   * @return {Element|string} node
   */
  get currentStateDescElement() {
    return this._currentStateDescElement;
  }

  /**
   * Set current state aria description
   * @param {string} text
   */
  set currentAriaState(text) {
    this._currentAriaState = text;
    this.currentStateDescElement.innerHTML = this._currentAriaState;
  }

  /**
   * @return {string} current state aria description
   */
  get currentAriaState() {
    if (!this._currentAriaState) {
      this._currentAriaState = this.currentStateDescElement.innerHTML;
    }

    return this._currentAriaState;
  }

  /**
   * Set current keyboard aria description
   * @param {string} text
   */
  set currentKeyboardDesc(text) {
    this._currentKeyboardDesc = text;
    this.keyboardDescElement.innerHTML = this._currentKeyboardDesc;
  }

  /**
   * @return {string} current keyboard aria description
   */
  get currentKeyboardDesc() {
    if (!this._currentKeyboardDesc) {
      this._currentKeyboardDesc = this.keyboardDescElement.innerHTML;
    }

    return this._currentKeyboardDesc;
  }

  set nextSibling(dndElem) {
    this.siblings.next = dndElem || null;
  }

  set prevSibling(dndElem) {
    this.siblings.prev = dndElem || null;
  }

  get nextSibling() {
    return this.sibling.next;
  }

  get prevSibling() {
    return this.sibling.prev;
  }

  get tabIndex() {
    return this._tabIndex;
  }

  set tabIndex(value) {
    const number = +value;

    this._tabIndex = !isNaN(number) ? number : -1;
    this.node.setAttribute('tabindex', this._tabIndex);
  }

  /**
   * @return {boolean} - current disabled/enabled state
   */
  get disabled() {
    this._disabled = this._disabled === undefined ? false : this._disabled;

    return this._disabled;
  }

  /**
   * Disable/enable element, add/remove user's disable class and appropriate html-attributes
   * @param {boolean} flag
   */
  set disabled(flag) {
    this._disabled = utils.checkOnBoolean(flag);

    this.node.setAttribute('aria-disabled', this._disabled);
    this.ariaHidden = this._disabled;

    if (this.disabledClassName && !cgUtils.hasClass(this.node, this.disabledClassName)) {
      this.addClass(this.disabledClassName);
    }

    if (this._disabled) {
      this.tabIndex = -1;
    } else if (this.disabledClassName && cgUtils.hasClass(this.node, this.disabledClassName)) {
      this.removeClass(this.disabledClassName);
    }
  }

  get ariaHidden() {
    if (!this._ariaHidden) {
      this._ariaHidden = 'false';
    }

    return this._ariaHidden;
  }

  set ariaHidden(flag) {
    this._ariaHidden = flag;

    if (!flag) {
      this.node.removeAttribute('aria-hidden');
    } else {
      this.node.setAttribute('aria-hidden', flag);
    }
  }

  /**
   * Set common hidden aria descriptions container
   * @param {Element} node
   */
  set hiddenDescContainer(node) {
    this._hiddenDescContainer = node;
  }

  /**
   * @return {Element} common description container node
   */
  get hiddenDescContainer() {
    return this._hiddenDescContainer;
  }

  _applySettings(settings) {
    const correctDeepMergedObj = merge.recursive(true, {}, this.constructor.DEFAULT_SETTINGS, settings);

    merge.recursive(this, correctDeepMergedObj);

    if (this.hasOwnProperty('node')) {
      this.node = this._checkSetting('node', this.node);
    } else {
      utils.showSettingError('node', undefined, 'Please set html-node element or html-selector');
    }

    for (const key in this) {
      if (this.hasOwnProperty(key) && key !== 'node') {
        this[key] = this._checkSetting(key, this[key]);
      }
    }

    this.tabIndex = -1;
  }

  disable() {
    this.disabled = true;
  }

  enable() {
    this.disabled = false;
  }

  focus(delay = 0) {
    if (delay) {
      setTimeout(() => this.node.focus(), delay);
    } else {
      this.node.focus();
    }
  }

  select() {
    this.node.click();
  }

  addClass(className) {
    const rightClassName = className.replace(/^\./, '');

    if (!cgUtils.hasClass(this.node, rightClassName)) {
      cgUtils.addClass(this.node, rightClassName);
    }
  }

  removeClass(className) {
    const rightClassName = className.replace(/^\./, '');

    if (cgUtils.hasClass(this.node, rightClassName)) {
      cgUtils.removeClass(this.node, rightClassName);
    }
  }

  /**
   * @callback descCB
   * @param {dropArea} dropArea
   * @return {string} - new element's aria-description
   */

  /**
   * Changes current hidden araia description for element
   * @param {descCB} userCB
   */
  changeCurrentKeyboardDesc(userCB) {
    this.currentKeyboardDesc = userCB(this);
  }

  _checkSetting(settingName, settingValue) {
    let verifiedValue;

    switch (settingName) {
      case 'node':
        verifiedValue = utils.getElement(settingValue);

        if (!verifiedValue) {
          utils.showSettingError(settingName, settingValue, 'Please set html-node element or html-selector');
        }

        break;
      case 'className':
      case 'disabledClassName':
        if (typeof settingValue === 'string') {
          verifiedValue = settingValue.replace(/^\./, '');
          settingName === 'className' && this.addClass(verifiedValue);
        } else {
          utils.showSettingError(settingName, settingValue, 'Please set string of class name.');
        }
        break;
      case 'ariaLabel':
      case 'ariaDescribedBy':
      case 'ariaLabelledBy':
        if (typeof settingValue === 'string') {
          verifiedValue = settingValue;
          if (verifiedValue.length) {
            this.node.setAttribute(this.constructor.ARIA_ATTRIBUTES[settingName], verifiedValue);
          }
        } else {
          utils.showSettingError(settingName, settingValue, 'Please set string.');
        }
        break;
      case 'groups':
      case 'accept':
        if (typeof settingValue === 'string') {
          verifiedValue = [...settingValue.split(' ')];
        } else if (Array.isArray(settingValue) && settingValue.every((item) => typeof item === 'string')) {
          verifiedValue = [...settingValue];
        } else {
          utils.showSettingError(settingName, settingValue, 'Please set string or array of strings.');
        }
        break;
      default:
        verifiedValue = settingValue;
    }

    return verifiedValue;
  }

  _getDefaultCoordinates() {
    const initCoordinates = utils.getElementPosition(this.node);

    this.coordinates = {};
    this._createCoordinatesObject('default', initCoordinates);

    return initCoordinates;
  }

  /**
   * Create element's position object with own updating method
   * @param {string} coordinatesName - coordinates object name
   * @param {object} coords - existing coordinates object
   */
  _createCoordinatesObject(coordinatesName, coords) {
    this.coordinates[coordinatesName] = coords || utils.getElementPosition(this.node);
    this.coordinates[coordinatesName] = merge.recursive(
      {},
      this.coordinates[coordinatesName],
      {
        update: (data) => merge.recursive(this.coordinates[coordinatesName], data || utils.getElementPosition(this.node))
      });
  }

  setSetting(name, value) {
    const checkedValue = typeof value === 'object' ? merge.recursive(true, {}, this[name] || {}, value) : value;

    this[name] = this._checkSetting(name, checkedValue);
  }

  getSetting(name) {
    return this[name];
  }

  /**
   * Add new attribute value to existing value
   * @param {string} attrName
   * @param {string} attrValue
   * @param {boolean} [toBegin=false] - if 'true', add new value at the beginning of the attribute, otherwise - at the end
   */
  addToExistingAttribute(attrName, attrValue, toBegin = false) {
    const existingAttrValue = this.getSetting(attrName) || '';

    this.setSetting(attrName, toBegin ? `${attrValue} ${existingAttrValue}` : `${existingAttrValue} ${attrValue}`);
  }

  initOwnAriaDescElement(commonAriaHiddenContainer) {
    this.hiddenDescContainer = commonAriaHiddenContainer;
    this.createOwnDescElements();
  }

  /**
   * Creates own hidden aria description's elements
   */
  createOwnDescElements() {
    this.constructor.ID_UNIQUE_COUNTER++;

    this.keyboardDescElement = utils.createHTML({
      html: '',
      container: this.hiddenDescContainer,
      attrs: { id: this.constructor.ARIA_DESC_IDS.KEYBOARD_ACCESS_DEC }
    });
    this.addToExistingAttribute('ariaDescribedBy', this.constructor.ARIA_DESC_IDS.KEYBOARD_ACCESS_DEC, true);

    this.currentStateDescElement = utils.createHTML({
      html: '',
      container: this.hiddenDescContainer,
      attrs: { id: this.constructor.ARIA_DESC_IDS.CURRENT_STATE_DESC }
    });
    this.addToExistingAttribute('ariaDescribedBy', this.constructor.ARIA_DESC_IDS.CURRENT_STATE_DESC, true);
  }
}

export default DefaultDndElement;

