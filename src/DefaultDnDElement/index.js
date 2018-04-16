import merge from 'merge';
import cgUtils from 'cg-component-utils';
import localUtils from '../utils';

/**
 * Accessible drag/drop element Component
 */
class DefaultDndElement {
  /**
   *DefaulDndElement's customizing settings
   * @typedef {Object} DnDElementSettings
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
  }

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

  set keyboardDescElement(node) {
    this._keyboardDescElement = localUtils.getElement(node);
  }

  get keyboardDescElement() {
    return this._keyboardDescElement;
  }

  set currentStateDescElement(node) {
    this._currentStateDescElement = localUtils.getElement(node);
  }

  get currentStateDescElement() {
    return this._currentStateDescElement;
  }

  set currentAriaState(text) {
    this.currentStateDescElement.innerHTML = text;
  }

  get currentAriaState() {
    return this.currentStateDescElement.innerHTML;
  }

  set currentKeyboardDesc(text) {
    this.keyboardDescElement.innerHTML = text;
  }

  get currentKeyboardDesc() {
    return this.keyboardDescElement.innerHTML;
  }

  set nextSibling(node) {
    this.siblings.next = node || null;
  }

  set prevSibling(node) {
    this.siblings.prev = node || null;
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

  get disabled() {
    this._disabled = this._disabled === undefined ? false : this._disabled;

    return this._disabled;
  }

  set disabled(flag) {
    this._disabled = localUtils.checkOnBoolean(flag);

    this.node.setAttribute('aria-disabled', this._disabled);
    this.ariaHidden = this._disabled;

    if (this.disabledClassName && !cgUtils.hasClass(this.node, this.disabledClassName)) {
      cgUtils.addClass(this.node, this.disabledClassName);
    }

    if (this._disabled) {
      this.tabIndex = -1;
    } else if (this.disabledClassName && cgUtils.hasClass(this.node, this.disabledClassName)) {
      cgUtils.removeClass(this.node, this.disabledClassName);
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

  set hiddenDescContainer(node) {
    this._hiddenDescContainer = node;
  }

  get hiddenDescContainer() {
    return this._hiddenDescContainer;
  }

  _applySettings(settings) {
    const correctDeepMergedObj = merge.recursive(true, this.constructor.DEFAULT_SETTINGS, settings);

    merge.recursive(this, correctDeepMergedObj);

    if (this.hasOwnProperty('node')) {
      this.node = this._checkSetting('node', this.node);
    } else {
      localUtils.showSettingError('node', undefined, 'Please set html-node element or html-selector');
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
    this._checkSetting('className', className);
  }

  changeCurrentKeyboardDesc(userCB) {
    this.currentKeyboardDesc = userCB(this);
  }

  _checkSetting(settingName, settingValue) {
    let verifiedValue;

    switch (settingName) {
      case 'node':
        verifiedValue = localUtils.getElement(settingValue);

        if (!verifiedValue) {
          localUtils.showSettingError(settingName, settingValue, 'Please set html-node element or html-selector');
        }

        break;
      case 'className':
      case 'disabledClassName':
        if (typeof settingValue === 'string') {
          verifiedValue = settingValue.replace(/^\./, '');
          settingName === 'className' && cgUtils.addClass(this.node, verifiedValue);
        } else {
          localUtils.showSettingError(settingName, settingValue, 'Please set string of class name.');
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
          localUtils.showSettingError(settingName, settingValue, 'Please set string.');
        }
        break;
      case 'groups':
      case 'accept':
        if (typeof settingValue === 'string') {
          verifiedValue = [...settingValue.split(' ')];
        } else if (Array.isArray(settingValue) && settingValue.every((item) => typeof item === 'string')) {
          verifiedValue = [...settingValue];
        } else {
          localUtils.showSettingError(settingName, settingValue, 'Please set string or array of strings.');
        }
        break;
      default:
        verifiedValue = settingValue;
    }

    return verifiedValue;
  }

  _getDefaultCoordinates() {
    const initCoordinates = localUtils.getElementPosition(this.node);

    this.coordinates = {};
    this._createCoordinatesObject('default', initCoordinates);

    return initCoordinates;
  }

  /**
   * Create element's position object with updating method
   * @param {string} coordinatesName - coordinates object name
   * @param {object} coords - existing coordinates object
   */
  _createCoordinatesObject(coordinatesName, coords) {
    this.coordinates[coordinatesName] = coords || localUtils.getElementPosition(this.node);
    this.coordinates[coordinatesName] = merge.recursive(
      {},
      this.coordinates[coordinatesName],
      {
        update: (data) => merge.recursive(this.coordinates[coordinatesName], data || localUtils.getElementPosition(this.node))
      });
  }

  setSetting(name, value) {
    const checkedValue = typeof value === 'object' ? merge.recursive(true, {}, this[name] || {}, value) : value;

    this[name] = this._checkSetting(name, checkedValue);
  }

  getSetting(name) {
    return this[name];
  }

  addToExistingAttribute(attrName, attrValue, toBegin = false) {
    const existingAttrValue = this.getSetting(attrName) || '';

    this.setSetting(attrName, toBegin ? `${attrValue} ${existingAttrValue}` : `${existingAttrValue} ${attrValue}`);
  }

  initOwnAriaDescElement(commonAriaHiddenContainer) {
    this.hiddenDescContainer = commonAriaHiddenContainer;
    this.createOwnDescElements();
  }

  createOwnDescElements() {
    this.constructor.ID_UNIQUE_COUNTER++;

    this.keyboardDescElement = localUtils.createHTML({
      html: '',
      container: this.hiddenDescContainer,
      attrs: { id: this.constructor.ARIA_DESC_IDS.KEYBOARD_ACCESS_DEC }
    });
    this.addToExistingAttribute('ariaDescribedBy', this.constructor.ARIA_DESC_IDS.KEYBOARD_ACCESS_DEC, true);

    this.currentStateDescElement = localUtils.createHTML({
      html: '',
      container: this.hiddenDescContainer,
      attrs: { id: this.constructor.ARIA_DESC_IDS.CURRENT_STATE_DESC }
    });
    this.addToExistingAttribute('ariaDescribedBy', this.constructor.ARIA_DESC_IDS.CURRENT_STATE_DESC, true);
  }
}

export default DefaultDndElement;

