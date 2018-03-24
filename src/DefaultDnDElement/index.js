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
    this._getDefaultPosition();

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

  _applySettings(settings) {
    merge(this, this.constructor.DEFAULT_SETTINGS, settings);

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
      case 'handler':
        if (typeof settingValue === 'string') {
          if (settingValue.length) {
            verifiedValue = localUtils.getElement(settingValue, this.node);
          }
        } else {
          localUtils.showSettingError(settingName, settingValue, 'Please set class selector or empty string.');
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
      case 'group':
      case 'accept':
        if (typeof settingValue === 'string' || (Array.isArray(settingValue) && settingValue.every((item) => typeof item === 'string'))) {
          verifiedValue = settingValue;
        } else {
          localUtils.showSettingError(settingName, settingValue, 'Please set string or array of strings.');
        }
        break;
      default:
        verifiedValue = settingValue;
    }

    return verifiedValue;
  }

  _getDefaultPosition() {
    this.coordinates = {};
    this.coordinates.default = this.coordinates.currentStart = localUtils.getElementPosition(this.node);
  }
}

export default DefaultDndElement;

