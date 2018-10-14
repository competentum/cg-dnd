import './index.less';

import merge from 'merge';
import utils from '../utils';
import cgUtils from 'cg-component-utils';

const DEFAULT_SHIFT = 10;
const LOCATION_SHIFT = {
  top: {
    x: 0,
    y: -DEFAULT_SHIFT
  },
  bottom: {
    x: 0,
    y: DEFAULT_SHIFT
  },
  left: {
    x: -DEFAULT_SHIFT,
    y: 0
  },
  right: {
    x: DEFAULT_SHIFT,
    y: 0
  }
};

/**
 * @typedef {Object} TooltipSettings
 * @property {string} html - html-string, which will be shown in the tooltip.
 * @property {string} className - tooltip's custom class name
 * @property {number} marginLeft - left tooltip's indent of for more precise tooltip's display by user settings
 * @property {number} marginBottom - bottom tooltip's indent of for more precise tooltip's display by user settings
 */

/**
 * Tooltip for dnd's elements
 */
class Tooltip {
  /**
   *Tooltip's customizing settings
   * @type {TooltipSettings}
   */
  static get DEFAULT_SETTINGS() {
    if (!this._DEFAULT_SETTINGS) {
      this._DEFAULT_SETTINGS = {
        html: 'Use arrow keys or touch swipes to choose an element and space button or double touch to select it.',
        className: '',
        location: 'top',
        position: 'start',
        maxWidth: 400,
        container: document.body
      };
    }

    return this._DEFAULT_SETTINGS;
  }

  static get DEFAULT_TOOLTIP_CLASS() {
    return 'cg-dnd-tooltip';
  }

  constructor(settings) {
    this._applySettings(settings);
    this._render();
  }

  /**
   * Set user's message, which he wants to show
   * @param {string} htmlString
   */
  set html(htmlString) {
    this._html = htmlString;

    if (this.messageContainer) {
      this.messageContainer.innerHTML = this._html;
    }
  }

  /**
   * @return {string} current tooltip's message
   */
  get html() {
    if (!this._html) {
      this._html = '';
    }

    return this._html;
  }

  /**
   * Creates new html-container for tooltip
   * @param {string|Element} htmlString
   */
  set node(htmlString) {
    if (this._node) {
      this.container.removeChild(this._node);
    }

    if (typeof htmlString === 'string') {
      this._node = cgUtils.createHTML(htmlString);
      this.container.appendChild(this._node);
    } else {
      this._node = htmlString;
    }
  }

  /**
   * @return {string|Element} current tooltip container
   */
  get node() {
    if (!this._node) {
      this._node = '';
    }

    return this._node;
  }

  /**
   * Creates new container inside tooltip's node for message only
   * @param {string|Element} htmlString
   */
  set messageContainer(htmlString) {
    if (this.node && this._messageContainer) {
      this.node.removeChild(this._messageContainer);
    }

    if (typeof htmlString === 'string') {
      this._messageContainer = cgUtils.createHTML(htmlString);
      this.node.appendChild(this._messageContainer);
    } else {
      this._messageContainer = htmlString;
    }
  }

  /**
   * @return {string|Element} current tooltip's message container
   */
  get messageContainer() {
    if (!this._messageContainer) {
      this._messageContainer = '';
    }

    return this._messageContainer;
  }

  get isVisible() {
    return this.node && this.node.style.display !== 'none';
  }

  set currentMaxWidth(value) {
    this._currentMaxWidth = value;

    if (this.node) {
      this.node.style.maxWidth = `${this._currentMaxWidth}px`;
    }
  }

  get currentMaxWidth() {
    return this._currentMaxWidth;
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
      case 'container':
        verifiedValue = utils.getElement(settingValue);

        if (!verifiedValue) {
          utils.showSettingError(settingName, settingValue, 'Please set html-node element or html-selector');
        }
        break;
      case 'location':
      case 'position':
        if (typeof settingValue === 'string' && settingValue.length) {
          verifiedValue = settingValue.toLowerCase();
        } else {
          utils.showSettingError(settingName, settingValue, 'Please set left|right|top|left.');
        }
        break;
      case 'className':
        if (typeof settingValue === 'string') {
          verifiedValue = settingValue.replace(/^\./, '');
        } else {
          utils.showSettingError(settingName, settingValue, 'Please set string of class name.');
        }
        break;
      case 'shift':
        if (typeof settingValue === 'object') {
          for (const key in settingValue) {
            if (settingValue.hasOwnProperty(key)) {
              settingValue[key] = this._checkSetting(key, settingValue[key]);
            }
          }

          verifiedValue = settingValue;
        } else {
          utils.showSettingError(settingName, settingValue, 'Please set Object with x and y properties.');
        }
        break;
      case 'x':
      case 'y':
      case 'maxWidth':
        verifiedValue = parseFloat(settingValue);

        if (isNaN(verifiedValue)) {
          utils.showSettingError(settingName, settingValue, 'Please set number.');
        }
        break;
      default:
        verifiedValue = settingValue;
    }

    return verifiedValue;
  }

  /**
   * Create and add tooltip to document
   * @private
   */
  _render() {
    this.node = `<div aria-hidden="true" role="presentation" class="${this.constructor.DEFAULT_TOOLTIP_CLASS} ${this.className}"
        data-tooltip-location="${this.location}"></div>`;

    this.messageContainer = `<div class="${this.constructor.DEFAULT_TOOLTIP_CLASS}-message-container">${this.html}</div>`;

    this.currentMaxWidth = this.maxWidth;
    this.hide();
  }

  getPosition(positions, sizeParam) {
    return {
      start: positions[0],
      center: positions[0] + sizeParam / 2,
      end: positions[1]
    };
  }

  _getCoordinates(elemCoords, location, position, shift) {
    const { left, right, top, bottom, width, height } = elemCoords;
    let x = shift.x;
    let y = shift.y;

    switch (location) {
      case 'top':
      case 'bottom':
        x += this.getPosition([left, right], width)[position];
        y += elemCoords[location];
        break;
      case 'left':
      case 'right':
        x += elemCoords[location];
        y += this.getPosition([top, bottom], height)[position];
        break;
      default:
    }

    return {
      x,
      y
    };
  }

  _getOffset(location) {
    return {
      x: location === 'left' ? this.node.offsetWidth : 0,
      y: location === 'top' ? this.node.offsetHeight : 0
    };
  }

  _checkMaxWidth(tooltipCoordinates, location) {
    const { x } = tooltipCoordinates;
    const availableMaxWidth = location === 'left' ? x : document.body.clientWidth - x;

    if (availableMaxWidth < this.maxWidth) {
      this.currentMaxWidth = availableMaxWidth;
    } else if (this.currentMaxWidth !== this.maxWidth) {
      this.currentMaxWidth = this.maxWidth;
    }
  }

  show(elem, params = {}) {
    const {
      message = this.html,
      location = this.location,
      position = this.position,
      shift = this.shift || LOCATION_SHIFT[location]
    } = params;
    const elemCoordinates = elem.coordinates.current || elem.coordinates.default;
    const tooltipCoordinates = this._getCoordinates(elemCoordinates, location, position, shift);

    if (message) {
      this.messageContainer.innerHTML = message;
    }

    this.node.setAttribute('data-tooltip-location', location);
    this._checkMaxWidth(tooltipCoordinates, location);

    /**
     * At first, show tooltip, that calculate its height, then move it to needed coordinates
     * @type {string}
     */
    this.node.style.display = 'block';

    const offset = this._getOffset(location);

    this.node.style.transform = `translate(${tooltipCoordinates.x - offset.x}px, ${tooltipCoordinates.y - offset.y}px)`;
  }

  hide() {
    this.node.style.display = 'none';
  }
}

export default Tooltip;
