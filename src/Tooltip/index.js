import './index.less';

import merge from 'merge';
import localUtils from '../utils';
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
        html: '',
        className: '',
        marginLeft: 0,
        marginBottom: 35
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
          localUtils.showSettingError(settingName, settingValue, `Please set html-string of ${settingName}.`);
        }
        break;
      case 'className':
        if (typeof settingValue === 'string') {
          verifiedValue = settingValue.replace(/^\./, '');
        } else {
          localUtils.showSettingError(settingName, settingValue, 'Please set string of class name.');
        }
        break;
      case 'marginLeft':
      case 'marginBottom':
        verifiedValue = parseFloat(settingValue);

        if (isNaN(verifiedValue)) {
          localUtils.showSettingError(settingName, settingValue, 'Please set number of margin.');
        }
        break;
      default:
        verifiedValue = settingValue;
    }

    return verifiedValue;
  }

  _render() {
    this.node = cgUtils.createHTML(`<div class="${this.constructor.DEFAULT_TOOLTIP_CLASS}">${this.html}
        <div class="${this.constructor.TOOLTIP_MARKER_CLASS}"></div></div>`);

    if (this.className) {
      cgUtils.addClass(this.node, this.className);
    }

    this.node.setAttribute('aria-hidden', true);
    this.node.setAttribute('role', 'presentation');

    document.body.appendChild(this.node);

    this.hide();
  }

  show(dragItem) {
    this.node.style.left = `${dragItem.coordinates.current.left + this.marginLeft}px`;
    this.node.style.top = `${dragItem.coordinates.current.top - this.marginBottom}px`;

    this.node.style.display = 'block';
  }

  hide() {
    this.node.style.display = 'none';
  }
}

export default Tooltip;
