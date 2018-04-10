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
        className: '',
      };
    }

    return this._DEFAULT_SETTINGS;
  }

  constructor(settings) {
    this._applySettings(settings);
    this._getDefaultCoordinates();

    this.siblings = {};
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

    if (this._disabled) {
      this.tabIndex = -1;
    }
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
        if (typeof settingValue === 'string') {
          verifiedValue = settingValue.replace(/^\./, '');
          cgUtils.addClass(this.node, verifiedValue);
        } else {
          localUtils.showSettingError(settingName, settingValue, 'Please set string of class name.');
        }
        break;
      case 'ariaLabel':
        if (typeof settingValue === 'string') {
          verifiedValue = settingValue;
          if (verifiedValue.length) {
            this.node.setAttribute('aria-label', verifiedValue);
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
}

export default DefaultDndElement;

