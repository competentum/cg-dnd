import './index.less';

import merge from 'merge';
import utils from '../utils';
import cgUtils from 'cg-component-utils';

/**
 * Accessible drag item Component
 */
class Tooltip {
  /**
   *DragItem's customizing settings
   * @typedef {Object} DragItemSettings
   */
  static get DEFAULT_SETTINGS() {
    if (!this._DEFAULT_SETTINGS) {
      this._DEFAULT_SETTINGS = {
        html: 'Use arrow keys or touch swipes to choose element and space button or double touch to select it.',
        className: '',
        marginLeft: 0,
        marginBottom: 10
      };
    }

    return this._DEFAULT_SETTINGS;
  }

  static get DEFAULT_TOOLTIP_CLASS() {
    return 'cg-dnd-tooltip';
  }

  static get TOOLTIP_MARKER_CLASS() {
    return `${this.DEFAULT_TOOLTIP_CLASS}-marker`;
  }

  constructor(settings) {
    this._applySettings(settings);
    this._render();
  }

  set html(htmlString) {
    this._html = htmlString;

    if (this.messageContainer) {
      this.messageContainer.innerHTML = this._html;
    }
  }

  get html() {
    if (!this._html) {
      this._html = '';
    }

    return this._html;
  }

  set node(htmlString) {
    if (this._node) {
      document.body.removeChild(this._node);
    }

    this._node = cgUtils.createHTML(htmlString);
    document.body.appendChild(this._node);
  }

  get node() {
    if (!this._node) {
      this._node = '';
    }

    return this._node;
  }

  set messageContainer(htmlString) {
    if (this.node && this._messageContainer) {
      this.node.removeChild(this._messageContainer);
    }
    this._messageContainer = cgUtils.createHTML(htmlString);
    this.node.appendChild(this._messageContainer);
  }

  get messageContainer() {
    if (!this._messageContainer) {
      this._messageContainer = '';
    }

    return this._messageContainer;
  }

  _applySettings(settings) {
    const correctDeepMergedObj = merge.recursive(true, this.constructor.DEFAULT_SETTINGS, settings);

    merge.recursive(this, correctDeepMergedObj);

    for (const key in this) {
      if (this.hasOwnProperty(key)) {
        this[key] = this._checkSetting(key, this[key]);
      }
    }
  }

  _checkSetting(settingName, settingValue) {
    let verifiedValue;

    switch (settingName) {
      case 'html':
        if (typeof settingValue === 'string' && settingValue.length) {
          verifiedValue = settingValue;
        } else {
          utils.showSettingError(settingName, settingValue, `Please set html-string of ${settingName}.`);
        }
        break;
      case 'className':
        if (typeof settingValue === 'string') {
          verifiedValue = settingValue.replace(/^\./, '');
        } else {
          utils.showSettingError(settingName, settingValue, 'Please set string of class name.');
        }
        break;
      case 'marginLeft':
      case 'marginBottom':
        verifiedValue = parseFloat(settingValue);

        if (isNaN(verifiedValue)) {
          utils.showSettingError(settingName, settingValue, 'Please set number of margin.');
        }
        break;
      default:
        verifiedValue = settingValue;
    }

    return verifiedValue;
  }

  _render() {
    this.node = `<div aria-hidden="true" role="presentation" class="${this.constructor.DEFAULT_TOOLTIP_CLASS}
        ${this.className}"><div class="${this.constructor.TOOLTIP_MARKER_CLASS}"></div></div>`;

    this.messageContainer = `<div class="${this.constructor.DEFAULT_TOOLTIP_CLASS}-message-container">${this.html}</div>`;

    this.hide();
  }

  show(elem, message = this.html) {
    const coordinates = elem.coordinates.current || elem.coordinates.default;

    if (message) {
      this.messageContainer.innerHTML = message;
    }

    /**
     * At first, show tooltip, that calculate its height, then move it to needed coordinates
     * @type {string}
     */
    this.node.style.display = 'block';
    this.node.style.left = `${coordinates.left + this.marginLeft}px`;
    this.node.style.top = `${coordinates.top - this.marginBottom - this.node.offsetHeight}px`;

  }

  hide() {
    this.node.style.display = 'none';
  }
}

export default Tooltip;
